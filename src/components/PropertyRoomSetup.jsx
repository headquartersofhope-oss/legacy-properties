import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Loader2, CheckCircle2 } from 'lucide-react';

export default function PropertyRoomSetup({ property, onComplete }) {
  const [rooms, setRooms] = useState(() => {
    // Seed from room_count if available
    const count = property?.room_count || 0;
    if (count > 0) {
      return Array.from({ length: count }, (_, i) => ({
        room_name: `Bedroom ${i + 1}`,
        capacity: 2,
        notes: '',
      }));
    }
    return [{ room_name: '', capacity: 2, notes: '' }];
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function addRoom() {
    setRooms(prev => [...prev, { room_name: `Bedroom ${prev.length + 1}`, capacity: 2, notes: '' }]);
  }

  function removeRoom(idx) {
    setRooms(prev => prev.filter((_, i) => i !== idx));
  }

  function update(idx, field, value) {
    setRooms(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }

  async function handleSave() {
    if (rooms.some(r => !r.room_name)) {
      setError('All rooms must have a name.');
      return;
    }
    setSaving(true);
    setError(null);
    setResult(null);
    try {
      const res = await base44.functions.invoke('autoGenerateRoomsAndBeds', {
        property_id: property.id,
        room_configs: rooms.map(r => ({ ...r, capacity: parseInt(r.capacity) || 1 })),
      });
      setResult(res.data);
      onComplete && onComplete();
    } catch (e) {
      setError(e.message || 'Failed to generate rooms and beds.');
    } finally {
      setSaving(false);
    }
  }

  const totalBeds = rooms.reduce((sum, r) => sum + (parseInt(r.capacity) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Room & Bed Configuration</h3>
          <p className="text-xs text-muted-foreground">{rooms.length} rooms · {totalBeds} beds total</p>
        </div>
        <Button size="sm" variant="outline" onClick={addRoom}>
          <Plus className="w-3 h-3 mr-1" /> Add Room
        </Button>
      </div>

      <div className="space-y-2">
        {rooms.map((room, idx) => (
          <div key={idx} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border border-border">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="Room Name (e.g. Bedroom 1)"
                value={room.room_name}
                onChange={e => update(idx, 'room_name', e.target.value)}
                className="h-8 text-sm"
              />
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  placeholder="Beds"
                  value={room.capacity}
                  onChange={e => update(idx, 'capacity', e.target.value)}
                  className="h-8 text-sm w-20"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">beds</span>
              </div>
            </div>
            <Input
              placeholder="Notes (optional)"
              value={room.notes}
              onChange={e => update(idx, 'notes', e.target.value)}
              className="h-8 text-sm flex-1 hidden md:block"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => removeRoom(idx)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Rooms & beds generated successfully</div>
            <div className="text-xs mt-1">
              {result.results?.rooms_created || 0} rooms created · {result.results?.beds_created || 0} beds created · {result.total_rooms} total rooms · {result.total_beds} total beds
              {result.results?.conflicts?.length > 0 && (
                <div className="text-amber-700 mt-1">⚠️ {result.results.conflicts.join(', ')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || rooms.length === 0} className="w-full">
        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating rooms & beds...</> : `Generate ${rooms.length} rooms & ${totalBeds} beds`}
      </Button>
    </div>
  );
}