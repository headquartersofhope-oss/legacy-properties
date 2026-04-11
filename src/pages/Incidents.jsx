import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FormModal from "@/components/FormModal";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Incidents() {
  const { isInternal } = useCurrentUser();
  const [incidents, setIncidents] = useState([]);
  const [sites, setSites] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ housing_resident_id: '', resident_name: '', site_id: '', site_name: '', incident_date: '', incident_type: 'other', severity: 'low', description: '', action_taken: '', internal_only: true, follow_up_status: 'none_needed' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [i, s, r] = await Promise.all([
      base44.entities.IncidentReport.list('-created_date'),
      base44.entities.HousingSite.list(),
      base44.entities.HousingResident.filter({ resident_status: 'active' }),
    ]);
    setIncidents(i); setSites(s); setResidents(r);
    setLoading(false);
  }

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'site_id') { const s = sites.find(x => x.id === value); next.site_name = s?.site_name || ''; }
      if (name === 'housing_resident_id') { const r = residents.find(x => x.id === value); next.resident_name = r ? `${r.first_name} ${r.last_name}` : ''; }
      return next;
    });
  }

  function openNew() { setForm({ housing_resident_id: '', resident_name: '', site_id: '', site_name: '', incident_date: new Date().toISOString().split('T')[0], incident_type: 'other', severity: 'low', description: '', action_taken: '', internal_only: true, follow_up_status: 'none_needed' }); setEditId(null); setShowForm(true); }
  function openEdit(inc) { setForm({ ...inc }); setEditId(inc.id); setShowForm(true); }

  async function handleSubmit() {
    setSaving(true);
    if (editId) await base44.entities.IncidentReport.update(editId, form);
    else await base44.entities.IncidentReport.create(form);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  if (!isInternal) return <div className="text-center py-12 text-muted-foreground">Access restricted.</div>;

  const columns = [
    { header: "Date", accessor: "incident_date" },
    { header: "Type", cell: r => <StatusBadge status={r.incident_type} /> },
    { header: "Severity", cell: r => <StatusBadge status={r.severity} /> },
    { header: "Site", accessor: "site_name" },
    { header: "Resident", accessor: "resident_name" },
    { header: "Follow-up", cell: r => <StatusBadge status={r.follow_up_status} /> },
  ];

  const typeOptions = [
    { value: 'behavioral', label: 'Behavioral' }, { value: 'property_damage', label: 'Property Damage' },
    { value: 'substance_use', label: 'Substance Use' }, { value: 'violence', label: 'Violence' },
    { value: 'noise', label: 'Noise' }, { value: 'unauthorized_guest', label: 'Unauthorized Guest' },
    { value: 'curfew_violation', label: 'Curfew Violation' }, { value: 'other', label: 'Other' },
  ];
  const severityOptions = [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }];
  const followUpOptions = [{ value: 'none_needed', label: 'None Needed' }, { value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In Progress' }, { value: 'completed', label: 'Completed' }];

  return (
    <div>
      <PageHeader title="Incident Reports" subtitle="Track and manage housing incidents">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Incident</Button>
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={incidents} onRowClick={openEdit} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Incident" : "New Incident"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Site" name="site_id" value={form.site_id} onChange={handleChange} type="select" options={sites.map(s => ({ value: s.id, label: s.site_name }))} required />
        <FormField label="Resident (optional)" name="housing_resident_id" value={form.housing_resident_id} onChange={handleChange} type="select" options={[{ value: '', label: 'N/A' }, ...residents.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }))]} />
        <FormField label="Incident Date" name="incident_date" value={form.incident_date} onChange={handleChange} type="date" required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" name="incident_type" value={form.incident_type} onChange={handleChange} type="select" options={typeOptions} />
          <FormField label="Severity" name="severity" value={form.severity} onChange={handleChange} type="select" options={severityOptions} />
        </div>
        <FormField label="Description" name="description" value={form.description} onChange={handleChange} type="textarea" rows={4} />
        <FormField label="Action Taken" name="action_taken" value={form.action_taken} onChange={handleChange} type="textarea" />
        <FormField label="Follow-up Status" name="follow_up_status" value={form.follow_up_status} onChange={handleChange} type="select" options={followUpOptions} />
        <FormField label="Internal Only" name="internal_only" value={form.internal_only} onChange={handleChange} type="checkbox" />
      </FormModal>
    </div>
  );
}