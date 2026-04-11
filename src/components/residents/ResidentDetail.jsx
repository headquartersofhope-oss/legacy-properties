import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import FormField from "@/components/FormField";
import { Loader2 } from "lucide-react";

export default function ResidentDetail({ open, onClose, resident, onUpdated }) {
  const [form, setForm] = useState({ ...resident });
  const [saving, setSaving] = useState(false);

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }

  async function save() {
    setSaving(true);
    await base44.entities.HousingResident.update(resident.id, form);
    setSaving(false);
    onUpdated();
  }

  async function moveOut() {
    setSaving(true);
    const exitDate = new Date().toISOString().split('T')[0];

    await base44.entities.HousingResident.update(resident.id, {
      resident_status: 'exited',
      actual_exit_date: exitDate,
    });

    // Release the bed
    if (resident.bed_id) {
      await base44.entities.Bed.update(resident.bed_id, { bed_status: 'available', current_resident_id: '' });
    }

    // End occupancy record
    const occupancies = await base44.entities.OccupancyRecord.filter({ housing_resident_id: resident.id, occupancy_status: 'active' });
    for (const occ of occupancies) {
      await base44.entities.OccupancyRecord.update(occ.id, { occupancy_status: 'ended', end_date: exitDate });
    }

    setSaving(false);
    onUpdated();
  }

  const r = form;
  const statusOptions = [
    { value: 'pending_move_in', label: 'Pending Move-In' }, { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' }, { value: 'exited', label: 'Exited' },
    { value: 'discharged', label: 'Discharged' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Resident: {r.first_name} {r.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2"><StatusBadge status={r.resident_status} /></div>

          <div className="space-y-0 text-sm">
            {[
              ['Site', r.site_name], ['Room', r.room_name], ['Bed', r.bed_label],
              ['Phone', r.phone], ['Email', r.email],
              ['Move-In', r.move_in_date], ['Expected Exit', r.expected_exit_date],
              ['Actual Exit', r.actual_exit_date],
              ['Emergency Contact', r.emergency_contact_name],
              ['Emergency Phone', r.emergency_contact_phone],
            ].filter(([_, v]) => v).map(([label, val]) => (
              <div key={label} className="flex justify-between py-1.5 border-b border-border/50">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-foreground">{val}</span>
              </div>
            ))}
          </div>

          <FormField label="Status" name="resident_status" value={r.resident_status} onChange={handleChange} type="select" options={statusOptions} />
          <FormField label="Expected Exit Date" name="expected_exit_date" value={r.expected_exit_date} onChange={handleChange} type="date" />
          <FormField label="Notes" name="notes" value={r.notes} onChange={handleChange} type="textarea" />

          <div className="flex justify-between gap-2 pt-3 border-t">
            {r.resident_status === 'active' && (
              <Button variant="destructive" onClick={moveOut} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Move Out
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}