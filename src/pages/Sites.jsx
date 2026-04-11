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

const defaultForm = { site_name: '', address: '', city: '', state: '', zip: '', site_type: 'transitional', gender_restriction: 'none', capacity: '', status: 'active', house_manager: '', phone: '', notes: '' };

export default function Sites() {
  const { isAdmin, isManager } = useCurrentUser();
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.HousingSite.list('-created_date');
    setSites(data);
    setLoading(false);
  }

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }

  function openEdit(site) {
    setForm({ ...site });
    setEditId(site.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    const payload = { ...form, capacity: Number(form.capacity) || 0 };
    if (editId) {
      await base44.entities.HousingSite.update(editId, payload);
    } else {
      await base44.entities.HousingSite.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    setEditId(null);
    load();
  }

  const columns = [
    { header: "Site Name", accessor: "site_name" },
    { header: "Address", cell: (r) => `${r.address || ''} ${r.city || ''} ${r.state || ''}`.trim() || '—' },
    { header: "Type", cell: (r) => <StatusBadge status={r.site_type} /> },
    { header: "Capacity", accessor: "capacity" },
    { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
    { header: "Manager", accessor: "house_manager" },
  ];

  const siteTypeOptions = [
    { value: 'transitional', label: 'Transitional' },
    { value: 'sober_living', label: 'Sober Living' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'other', label: 'Other' },
  ];

  const genderOptions = [
    { value: 'none', label: 'None' },
    { value: 'male_only', label: 'Male Only' },
    { value: 'female_only', label: 'Female Only' },
    { value: 'family', label: 'Family' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'under_maintenance', label: 'Under Maintenance' },
  ];

  return (
    <div>
      <PageHeader title="Sites / Houses" subtitle="Manage housing sites and properties">
        {(isAdmin || isManager) && (
          <Button onClick={() => { setForm(defaultForm); setEditId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Site
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={sites} onRowClick={(isAdmin || isManager) ? openEdit : undefined} />
      )}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Site" : "Add Site"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Site Name" name="site_name" value={form.site_name} onChange={handleChange} required />
        <FormField label="Address" name="address" value={form.address} onChange={handleChange} />
        <div className="grid grid-cols-3 gap-3">
          <FormField label="City" name="city" value={form.city} onChange={handleChange} />
          <FormField label="State" name="state" value={form.state} onChange={handleChange} />
          <FormField label="ZIP" name="zip" value={form.zip} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Site Type" name="site_type" value={form.site_type} onChange={handleChange} type="select" options={siteTypeOptions} />
          <FormField label="Gender Restriction" name="gender_restriction" value={form.gender_restriction} onChange={handleChange} type="select" options={genderOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Capacity" name="capacity" value={form.capacity} onChange={handleChange} type="number" />
          <FormField label="Status" name="status" value={form.status} onChange={handleChange} type="select" options={statusOptions} />
        </div>
        <FormField label="House Manager" name="house_manager" value={form.house_manager} onChange={handleChange} />
        <FormField label="Phone" name="phone" value={form.phone} onChange={handleChange} />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}