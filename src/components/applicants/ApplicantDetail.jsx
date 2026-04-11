import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import FormField from "@/components/FormField";
import { Loader2 } from "lucide-react";

export default function ApplicantDetail({ open, onClose, applicant, onUpdated }) {
  const [form, setForm] = useState({ ...applicant });
  const [sites, setSites] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.HousingSite.filter({ status: 'active' }),
      base44.entities.Room.filter({ status: 'active' }),
      base44.entities.Bed.filter({ bed_status: 'available', status: 'active' }),
    ]).then(([s, r, b]) => { setSites(s); setRooms(r); setBeds(b); });
  }, []);

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }

  async function save() {
    setSaving(true);
    await base44.entities.HousingApplicant.update(applicant.id, form);
    setSaving(false);
    onUpdated();
  }

  async function convertToResident() {
    setSaving(true);
    const selectedBed = beds.find(b => b.id === form.assigned_bed_id);
    const selectedRoom = rooms.find(r => r.id === selectedBed?.room_id);
    const selectedSite = sites.find(s => s.id === selectedBed?.site_id);

    const resident = await base44.entities.HousingResident.create({
      applicant_id: applicant.id,
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      email: form.email,
      site_id: selectedSite?.id || '',
      site_name: selectedSite?.site_name || '',
      room_id: selectedRoom?.id || '',
      room_name: selectedRoom?.room_name || '',
      bed_id: selectedBed?.id || '',
      bed_label: selectedBed?.bed_label || '',
      move_in_date: new Date().toISOString().split('T')[0],
      resident_status: 'active',
      emergency_contact_name: form.emergency_contact_name || '',
      emergency_contact_phone: form.emergency_contact_phone || '',
      house_rules_signed: form.house_rules_signed || false,
    });

    // Update bed to occupied
    if (selectedBed) {
      await base44.entities.Bed.update(selectedBed.id, { bed_status: 'occupied', current_resident_id: resident.id });
    }

    // Create occupancy record
    await base44.entities.OccupancyRecord.create({
      housing_resident_id: resident.id,
      resident_name: `${form.first_name} ${form.last_name}`,
      site_id: selectedSite?.id || '',
      site_name: selectedSite?.site_name || '',
      room_id: selectedRoom?.id || '',
      room_name: selectedRoom?.room_name || '',
      bed_id: selectedBed?.id || '',
      bed_label: selectedBed?.bed_label || '',
      start_date: new Date().toISOString().split('T')[0],
      occupancy_status: 'active',
    });

    // Update applicant
    await base44.entities.HousingApplicant.update(applicant.id, {
      applicant_status: 'placed',
      intake_status: 'completed',
    });

    setSaving(false);
    onUpdated();
  }

  const a = form;
  const intakeOptions = [
    { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
  ];
  const statusOptions = [
    { value: 'new', label: 'New' }, { value: 'screening', label: 'Screening' },
    { value: 'eligible', label: 'Eligible' }, { value: 'ineligible', label: 'Ineligible' },
    { value: 'ready_for_placement', label: 'Ready for Placement' }, { value: 'placed', label: 'Placed' },
  ];
  const docOptions = [
    { value: 'incomplete', label: 'Incomplete' }, { value: 'pending_review', label: 'Pending Review' },
    { value: 'complete', label: 'Complete' }, { value: 'issues', label: 'Issues' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Applicant: {a.first_name} {a.last_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={a.intake_status} />
            <StatusBadge status={a.applicant_status} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Intake Status" name="intake_status" value={a.intake_status} onChange={handleChange} type="select" options={intakeOptions} />
            <FormField label="Applicant Status" name="applicant_status" value={a.applicant_status} onChange={handleChange} type="select" options={statusOptions} />
          </div>
          <FormField label="Documents Status" name="documents_status" value={a.documents_status} onChange={handleChange} type="select" options={docOptions} />
          <FormField label="Emergency Contact Name" name="emergency_contact_name" value={a.emergency_contact_name} onChange={handleChange} />
          <FormField label="Emergency Contact Phone" name="emergency_contact_phone" value={a.emergency_contact_phone} onChange={handleChange} />
          <FormField label="House Rules Signed" name="house_rules_signed" value={a.house_rules_signed} onChange={handleChange} type="checkbox" />
          <FormField label="Eligibility Notes" name="eligibility_notes" value={a.eligibility_notes} onChange={handleChange} type="textarea" />
          <FormField label="Internal Notes" name="internal_notes" value={a.internal_notes} onChange={handleChange} type="textarea" />

          {a.applicant_status === 'ready_for_placement' && (
            <div className="pt-3 border-t space-y-3">
              <h3 className="text-sm font-semibold">Bed Assignment</h3>
              <FormField label="Select Available Bed" name="assigned_bed_id" value={a.assigned_bed_id || ''} onChange={handleChange} type="select"
                options={beds.map(b => ({ value: b.id, label: `${b.site_name} / ${b.room_name} / ${b.bed_label}` }))} />
              <Button onClick={convertToResident} disabled={saving || !a.assigned_bed_id}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Move In & Create Resident
              </Button>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}