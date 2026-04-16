import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BedDouble, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BedAssignment({ open, onClose, resident, onAssigned }) {
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [propertyId, setPropertyId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [bedId, setBedId] = useState('');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      base44.entities.Property.list().then(r => setProperties(r.filter(p => p.house_status === 'active')));
    }
  }, [open]);

  useEffect(() => {
    if (propertyId) {
      base44.entities.Room.filter({ site_id: propertyId, status: 'active' }).then(setRooms);
      setRoomId(''); setBedId('');
    }
  }, [propertyId]);

  useEffect(() => {
    if (roomId) {
      base44.entities.Bed.filter({ room_id: roomId, bed_status: 'available', status: 'active' }).then(setBeds);
      setBedId('');
    }
  }, [roomId]);

  async function handleAssign() {
    if (!bedId) { setError('Please select a bed.'); return; }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await base44.functions.invoke('assignResidentToBed', {
        resident_id: resident.id,
        property_id: propertyId,
        room_id: roomId,
        bed_id: bedId,
        move_in_date: moveInDate,
      });
      setSuccess(res.data?.message || 'Assigned successfully!');
      setTimeout(() => { onAssigned && onAssigned(); onClose(); }, 1500);
    } catch (e) {
      setError(e.message || 'Assignment failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-primary" />
            Assign Bed — {resident?.first_name} {resident?.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Property</label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {propertyId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Room</label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select room..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_name} (cap: {r.capacity})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {roomId && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Available Bed</label>
              {beds.length === 0 ? (
                <p className="text-sm text-amber-600 mt-1">No available beds in this room.</p>
              ) : (
                <Select value={bedId} onValueChange={setBedId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select bed..." />
                  </SelectTrigger>
                  <SelectContent>
                    {beds.map(b => <SelectItem key={b.id} value={b.id}>{b.bed_label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">Move-In Date</label>
            <input
              type="date"
              value={moveInDate}
              onChange={e => setMoveInDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleAssign} disabled={saving || !bedId} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Assign Bed
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}