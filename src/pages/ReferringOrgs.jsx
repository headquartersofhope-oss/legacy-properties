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

export default function ReferringOrgs() {
  const { isAdmin, isManager } = useCurrentUser();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ organization_name: '', contact_name: '', contact_email: '', contact_phone: '', organization_type: 'nonprofit', status: 'active', notes: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.ReferringOrganization.list('-created_date');
    setOrgs(data);
    setLoading(false);
  }

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }
  function openEdit(org) { setForm({ ...org }); setEditId(org.id); setShowForm(true); }

  async function handleSubmit() {
    setSaving(true);
    if (editId) await base44.entities.ReferringOrganization.update(editId, form);
    else await base44.entities.ReferringOrganization.create(form);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  const columns = [
    { header: "Organization", accessor: "organization_name" },
    { header: "Contact", accessor: "contact_name" },
    { header: "Email", accessor: "contact_email" },
    { header: "Phone", accessor: "contact_phone" },
    { header: "Type", cell: r => <StatusBadge status={r.organization_type} /> },
    { header: "Status", cell: r => <StatusBadge status={r.status} /> },
  ];

  const orgTypeOptions = [
    { value: 'nonprofit', label: 'Nonprofit' }, { value: 'government', label: 'Government' },
    { value: 'healthcare', label: 'Healthcare' }, { value: 'faith_based', label: 'Faith-Based' },
    { value: 'other', label: 'Other' },
  ];
  const statusOptions = [
    { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
    { value: 'pending_approval', label: 'Pending Approval' },
  ];

  return (
    <div>
      <PageHeader title="Referring Organizations" subtitle="Manage partner organizations">
        {(isAdmin || isManager) && (
          <Button onClick={() => { setForm({ organization_name: '', contact_name: '', contact_email: '', contact_phone: '', organization_type: 'nonprofit', status: 'active', notes: '' }); setEditId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Organization
          </Button>
        )}
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={orgs} onRowClick={(isAdmin || isManager) ? openEdit : undefined} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Organization" : "Add Organization"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Organization Name" name="organization_name" value={form.organization_name} onChange={handleChange} required />
        <FormField label="Contact Name" name="contact_name" value={form.contact_name} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Email" name="contact_email" value={form.contact_email} onChange={handleChange} />
          <FormField label="Phone" name="contact_phone" value={form.contact_phone} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Type" name="organization_type" value={form.organization_type} onChange={handleChange} type="select" options={orgTypeOptions} />
          <FormField label="Status" name="status" value={form.status} onChange={handleChange} type="select" options={statusOptions} />
        </div>
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}