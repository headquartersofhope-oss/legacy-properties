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

export default function Compliance() {
  const { isInternal } = useCurrentUser();
  const [checks, setChecks] = useState([]);
  const [sites, setSites] = useState([]);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', site_name: '', room_id: '', bed_id: '', housing_resident_id: '', resident_name: '', check_type: 'room_inspection', check_date: '', result: 'pass', notes: '', follow_up_needed: false });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [c, s, r] = await Promise.all([
      base44.entities.ComplianceCheck.list('-created_date'),
      base44.entities.HousingSite.list(),
      base44.entities.HousingResident.filter({ resident_status: 'active' }),
    ]);
    setChecks(c); setSites(s); setResidents(r);
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

  function openNew() { setForm({ site_id: '', site_name: '', room_id: '', bed_id: '', housing_resident_id: '', resident_name: '', check_type: 'room_inspection', check_date: new Date().toISOString().split('T')[0], result: 'pass', notes: '', follow_up_needed: false }); setEditId(null); setShowForm(true); }
  function openEdit(c) { setForm({ ...c }); setEditId(c.id); setShowForm(true); }

  async function handleSubmit() {
    setSaving(true);
    if (editId) await base44.entities.ComplianceCheck.update(editId, form);
    else await base44.entities.ComplianceCheck.create(form);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  if (!isInternal) return <div className="text-center py-12 text-muted-foreground">Access restricted.</div>;

  const columns = [
    { header: "Date", accessor: "check_date" },
    { header: "Type", cell: r => <StatusBadge status={r.check_type} /> },
    { header: "Site", accessor: "site_name" },
    { header: "Resident", cell: r => r.resident_name || '—' },
    { header: "Result", cell: r => <StatusBadge status={r.result} /> },
    { header: "Follow-up", cell: r => r.follow_up_needed ? <StatusBadge status="pending" /> : '—' },
  ];

  const checkTypeOptions = [
    { value: 'room_inspection', label: 'Room Inspection' }, { value: 'bed_check', label: 'Bed Check' },
    { value: 'resident_compliance', label: 'Resident Compliance' }, { value: 'house_compliance', label: 'House Compliance' },
    { value: 'safety_inspection', label: 'Safety Inspection' }, { value: 'fire_inspection', label: 'Fire Inspection' },
    { value: 'other', label: 'Other' },
  ];
  const resultOptions = [{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }, { value: 'needs_attention', label: 'Needs Attention' }, { value: 'not_applicable', label: 'N/A' }];

  return (
    <div>
      <PageHeader title="Compliance Checks" subtitle="Inspections and compliance tracking">
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Check</Button>
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={checks} onRowClick={openEdit} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Check" : "New Check"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Site" name="site_id" value={form.site_id} onChange={handleChange} type="select" options={sites.map(s => ({ value: s.id, label: s.site_name }))} required />
        <FormField label="Resident (optional)" name="housing_resident_id" value={form.housing_resident_id} onChange={handleChange} type="select" options={[{ value: '', label: 'N/A' }, ...residents.map(r => ({ value: r.id, label: `${r.first_name} ${r.last_name}` }))]} />
        <FormField label="Check Date" name="check_date" value={form.check_date} onChange={handleChange} type="date" required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Check Type" name="check_type" value={form.check_type} onChange={handleChange} type="select" options={checkTypeOptions} />
          <FormField label="Result" name="result" value={form.result} onChange={handleChange} type="select" options={resultOptions} />
        </div>
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
        <FormField label="Follow-up Needed" name="follow_up_needed" value={form.follow_up_needed} onChange={handleChange} type="checkbox" />
      </FormModal>
    </div>
  );
}