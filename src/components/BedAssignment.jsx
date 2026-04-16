import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BedDouble, CheckCircle2, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * BedAssignment modal
 * Two modes:
 *  1. resident-first: pass `resident` → staff selects property → room → bed
 *  2. bed-first: pass `bed` → staff selects a resident to place in that specific bed
 *
 * Props:
 *  - resident: HousingResident object (resident-first mode)
 *  - bed: Bed object (bed-first mode)
 *  - onClose: () => void
 *  - onSuccess / onAssigned: () => void (both accepted for backwards compat)
 */
export default function BedAssignment({ resident, bed: preSelectedBed, onClose, onSuccess, onAssigned }) {
  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [residents, setResidents] = useState([]);

  const [propertyId, setPropertyId] = useState(preSelectedBed?.site_id || '');
  const [roomId, setRoomId] = useState(preSelectedBed?.room_id || '');
  const [bedId, setBedId] = useState(preSelectedBed?.id || '');
  const [residentId, setResidentId] = useState(resident?.id || '');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isBedFirst = !!preSelectedBed;
  const isResidentFirst = !!resident;

  useEffect(() => {
    // Load properties always
    base44.entities.Property.list().then(r => setProperties((r || []).filter(p => p.house_status === 'active')));

    // If bed-first mode, load residents
    if (isBedFirst) {
      base44.entities.HousingResident.list().then(r =>
        setResidents((r || []).filter(x => ['active', 'pending_move_in'].includes(x.resident_status)))
      );
    }
  }, []);

  useEffect(() => {
    if (propertyId && !isBedFirst) {
      base44.entities.Room.filter({ site_id: propertyId, status: 'active' }).then(setRooms);
      setRoomId(''); setBedId('');
    }
  }, [propertyId]);

  useEffect(() => {
    if (roomId && !isBedFirst) {
      base44.entities.Bed.filter({ room_id: roomId, bed_status: 'available', status: 'active' }).then(setBeds);
      setBedId('');
    }
  }, [roomId]);

  const handleClose = () => onClose?.();
  const handleSuccess = () => { onSuccess?.(); onAssigned?.(); };

  async function handleAssign() {
    if (!bedId) { setError('Please select a bed.'); return; }
    if (!residentId) { setError('Please select a resident.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await base44.functions.invoke('assignResidentToBed', {
        resident_id: residentId,
        property_id: propertyId || preSelectedBed?.site_id,
        room_id: roomId || preSelectedBed?.room_id,
        bed_id: bedId,
        move_in_date: moveInDate,
      });
      setSuccess(res.data?.message || 'Assigned successfully!');
      setTimeout(() => { handleSuccess(); handleClose(); }, 1400);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Assignment failed.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  const title = isBedFirst
    ? `Assign Resident to ${preSelectedBed.bed_label}`
    : `Assign Bed — ${resident?.first_name} ${resident?.last_name}`;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isBedFirst ? <UserPlus className="w-5 h-5 text-primary" /> : <BedDouble className="w-5 h-5 text-primary" />}
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">

          {/* BED-FIRST MODE: show bed info, select resident */}
          {isBedFirst && (
            <>
              <div className="bg-muted/40 rounded-lg p-3 text-sm">
                <div className="font-medium">{preSelectedBed.bed_label}</div>
                <div className="text-xs text-muted-foreground">{preSelectedBed.room_name} · {preSelectedBed.site_name}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Select Resident *</label>
                <Select value={residentId} onValueChange={setResidentId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a resident..." />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.length === 0 && <SelectItem value="_none" disabled>No eligible residents</SelectItem>}
                    {residents.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.first_name} {r.last_name} — {r.resident_status.replace(/_/g, ' ')}
                        {r.site_name ? ` (${r.site_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* RESIDENT-FIRST MODE: select property → room → bed */}
          {!isBedFirst && (
            <>
              {resident && (
                <div className="bg-muted/40 rounded-lg p-3 text-sm">
                  <div className="font-medium">{resident.first_name} {resident.last_name}</div>
                  {resident.site_name && (
                    <div className="text-xs text-muted-foreground">
                      Currently: {resident.site_name}{resident.room_name ? ` · ${resident.room_name}` : ''}{resident.bed_label ? ` · ${resident.bed_label}` : ''}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Property *</label>
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
                  <label className="text-xs font-medium text-muted-foreground">Room *</label>
                  <Select value={roomId} onValueChange={setRoomId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.length === 0 && <SelectItem value="_none" disabled>No active rooms</SelectItem>}
                      {rooms.map(r => <SelectItem key={r.id} value={r.id}>{r.room_name} (cap: {r.capacity})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {roomId && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Available Bed *</label>
                  {beds.length === 0 ? (
                    <p className="text-sm text-amber-600 mt-1 bg-amber-50 rounded p-2 border border-amber-200">
                      No available beds in this room.
                    </p>
                  ) : (
                    <Select value={bedId} onValueChange={setBedId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select bed..." />
                      </SelectTrigger>
                      <SelectContent>
                        {beds.map(b => <SelectItem key={b.id} value={b.id}>{b.bed_label} {b.bed_type ? `(${b.bed_type.replace(/_/g, ' ')})` : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </>
          )}

          {/* Move-in date (both modes) */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Move-In Date</label>
            <input
              type="date"
              value={moveInDate}
              onChange={e => setMoveInDate(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-destructive bg-destructive/10 rounded p-2">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-green-700 text-sm bg-green-50 rounded p-2 border border-green-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {success}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={saving}>Cancel</Button>
            <Button
              onClick={handleAssign}
              disabled={saving || !bedId || !residentId}
              className="flex-1 gap-1"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Assign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}