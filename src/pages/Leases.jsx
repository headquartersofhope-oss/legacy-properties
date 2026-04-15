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
import AccessDenied from "@/components/AccessDenied";

const defaultForm = {
  property_id: '', property_name: '', owner_id: '', owner_name: '',
  lessor_entity: '', lessee_entity: '', lease_type: 'master_lease',
  lease_start_date: '', lease_end_date: '', monthly_amount: '',
  deposit_amount: '', utilities_responsibility: '', furnishing_responsibility: '',
  renewal_status: 'active', contract_document_link: '', notes: ''
};

export default function Leases() {
  const { isAdmin, isManager } = useCurrentUser();
  const [leases, setLeases] = useState([]);
  const [properties, setProperties] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [l, p, o] = await Promise.all([
      base44.entities.Lease.list('-created_date'),
      base44.entities.Property.list(),
      base44.entities.PropertyOwner.list()
    ]);
    setLeases(l);
    setProperties(p);
    setOwners(o);
    setLoading(false);
  }

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'property_id') {
        const prop = properties.find(p => p.id === value);
        next.property_name = prop?.property_name || '';
      }
      if (name === 'owner_id') {
        const owner = owners.find(o => o.id === value);
        next.owner_name = owner?.owner_name || '';
      }
      return next;
    });
  }

  function openEdit(lease) {
    setForm({ ...lease });
    setEditId(lease.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    const payload = { ...form, monthly_amount: Number(form.monthly_amount) || 0, deposit_amount: Number(form.deposit_amount) || 0 };
    if (editId) {
      await base44.entities.Lease.update(editId, payload);
    } else {
      await base44.entities.Lease.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    setEditId(null);
    load();
  }

  if (!isAdmin && !isManager) {
    return <AccessDenied message="Lease management is restricted to admins and managers." />;
  }

  const columns = [
    { header: "Property", accessor: "property_name" },
    { header: "Owner", accessor: "owner_name" },
    { header: "Type", cell: r => <StatusBadge status={r.lease_type} /> },
    { header: "Start Date", cell: r => r.lease_start_date ? new Date(r.lease_start_date).toLocaleDateString() : '—' },
    { header: "End Date", cell: r => r.lease_end_date ? new Date(r.lease_end_date).toLocaleDateString() : '—' },
    { header: "Status", cell: r => <StatusBadge status={r.renewal_status} /> },
  ];

  const typeOptions = [
    { value: 'master_lease', label: 'Master Lease' },
    { value: 'operating_agreement', label: 'Operating Agreement' },
    { value: 'property_management', label: 'Property Management' },
    { value: 'other', label: 'Other' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'upcoming_renewal', label: 'Upcoming Renewal' },
    { value: 'expired', label: 'Expired' },
    { value: 'terminated', label: 'Terminated' },
    { value: 'pending_signature', label: 'Pending Signature' },
  ];

  return (
    <div>
      <PageHeader title="Leases" subtitle="Manage property leases and ownership agreements">
        {(isAdmin || isManager) && (
          <Button onClick={() => { setForm(defaultForm); setEditId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Lease
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={leases} onRowClick={openEdit} />
      )}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Lease" : "Add Lease"} onSubmit={handleSubmit} loading={saving}>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Property" name="property_id" value={form.property_id} onChange={handleChange} type="select" options={properties.map(p => ({ value: p.id, label: p.property_name }))} />
          <FormField label="Owner" name="owner_id" value={form.owner_id} onChange={handleChange} type="select" options={owners.map(o => ({ value: o.id, label: o.owner_name }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Lease Type" name="lease_type" value={form.lease_type} onChange={handleChange} type="select" options={typeOptions} />
          <FormField label="Renewal Status" name="renewal_status" value={form.renewal_status} onChange={handleChange} type="select" options={statusOptions} />
        </div>
        <FormField label="Lessor Entity" name="lessor_entity" value={form.lessor_entity} onChange={handleChange} placeholder="e.g., RE Jones Properties" />
        <FormField label="Lessee Entity" name="lessee_entity" value={form.lessee_entity} onChange={handleChange} />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start Date" name="lease_start_date" value={form.lease_start_date} onChange={handleChange} type="date" />
          <FormField label="End Date" name="lease_end_date" value={form.lease_end_date} onChange={handleChange} type="date" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Monthly Amount" name="monthly_amount" value={form.monthly_amount} onChange={handleChange} type="number" />
          <FormField label="Deposit Amount" name="deposit_amount" value={form.deposit_amount} onChange={handleChange} type="number" />
        </div>
        <FormField label="Utilities Responsibility" name="utilities_responsibility" value={form.utilities_responsibility} onChange={handleChange} />
        <FormField label="Furnishing Responsibility" name="furnishing_responsibility" value={form.furnishing_responsibility} onChange={handleChange} />
        <FormField label="Contract Document Link" name="contract_document_link" value={form.contract_document_link} onChange={handleChange} placeholder="Google Drive link or file reference" />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}