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
  property_name: '', full_address: '', city: '', state: '', zip: '',
  property_type: 'transitional_housing', ownership_type: 're_jones_owned',
  house_status: 'active', visible_to_partners: true, visible_publicly: false,
  total_bed_count: 0, room_count: 0, bathroom_count: 0, kitchen_count: 0,
  refrigerators: false, tech_room: false, gym_area: false, lockers: false,
  washer_dryer: false, internet_wifi: true, parking: false, ada_accessible: false,
  furnishing_level: 'partially_furnished', demographic_focus: '',
  compatible_demographics: '', gender_restriction: 'none',
  house_manager_name: '', house_manager_email: '', house_manager_phone: '',
  notes: ''
};

export default function Properties() {
  const { isAdmin, isManager } = useCurrentUser();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.Property.list('-created_date');
    setProperties(data);
    setLoading(false);
  }

  function handleChange(name, value) { setForm(prev => ({ ...prev, [name]: value })); }

  function openEdit(prop) {
    setForm({ ...prop });
    setEditId(prop.id);
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    const payload = { ...form, total_bed_count: Number(form.total_bed_count) || 0 };
    if (editId) {
      await base44.entities.Property.update(editId, payload);
    } else {
      await base44.entities.Property.create(payload);
    }
    setSaving(false);
    setShowForm(false);
    setForm(defaultForm);
    setEditId(null);
    load();
  }

  if (!isAdmin && !isManager) {
    return <AccessDenied message="Property management is restricted to admins and managers." />;
  }

  const columns = [
    { header: "Name", accessor: "property_name" },
    { header: "Address", cell: r => `${r.city}, ${r.state}` },
    { header: "Type", cell: r => <StatusBadge status={r.property_type} /> },
    { header: "Beds", accessor: "total_bed_count" },
    { header: "Status", cell: r => <StatusBadge status={r.house_status} /> },
    { header: "Ownership", cell: r => <StatusBadge status={r.ownership_type} /> },
  ];

  const typeOptions = [
    { value: 'transitional_housing', label: 'Transitional Housing' },
    { value: 'sober_living', label: 'Sober Living' },
    { value: 'veteran_house', label: 'Veteran House' },
    { value: 'justice_reentry', label: 'Justice/Reentry' },
    { value: 'treatment_recovery', label: 'Treatment/Recovery' },
    { value: 'womens_house', label: 'Women\'s House' },
    { value: 'mens_house', label: 'Men\'s House' },
    { value: 'mixed_special', label: 'Mixed/Special' },
  ];

  const ownershipOptions = [
    { value: 're_jones_owned', label: 'RE Jones Owned' },
    { value: 'master_lease', label: 'Master Lease' },
    { value: 'master_lease_global', label: 'Master Lease (Global)' },
    { value: 'third_party_partner', label: 'Third-Party Partner' },
  ];

  const furnishingOptions = [
    { value: 'unfurnished', label: 'Unfurnished' },
    { value: 'partially_furnished', label: 'Partially Furnished' },
    { value: 'fully_furnished', label: 'Fully Furnished' },
    { value: 'premium_furnished', label: 'Premium Furnished' },
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'under_maintenance', label: 'Under Maintenance' },
    { value: 'pending_setup', label: 'Pending Setup' },
  ];

  const genderOptions = [
    { value: 'none', label: 'None' },
    { value: 'male_only', label: 'Male Only' },
    { value: 'female_only', label: 'Female Only' },
    { value: 'mixed', label: 'Mixed' },
  ];

  return (
    <div>
      <PageHeader title="Properties" subtitle="Manage all housing properties and houses">
        {(isAdmin || isManager) && (
          <Button onClick={() => { setForm(defaultForm); setEditId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Property
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={properties} onRowClick={openEdit} />
      )}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Property" : "Add Property"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Property Name" name="property_name" value={form.property_name} onChange={handleChange} required />
        <FormField label="Full Address" name="full_address" value={form.full_address} onChange={handleChange} />
        <div className="grid grid-cols-3 gap-3">
          <FormField label="City" name="city" value={form.city} onChange={handleChange} />
          <FormField label="State" name="state" value={form.state} onChange={handleChange} />
          <FormField label="ZIP" name="zip" value={form.zip} onChange={handleChange} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Property Type" name="property_type" value={form.property_type} onChange={handleChange} type="select" options={typeOptions} />
          <FormField label="Ownership Type" name="ownership_type" value={form.ownership_type} onChange={handleChange} type="select" options={ownershipOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="House Status" name="house_status" value={form.house_status} onChange={handleChange} type="select" options={statusOptions} />
          <FormField label="Gender Restriction" name="gender_restriction" value={form.gender_restriction} onChange={handleChange} type="select" options={genderOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Total Beds" name="total_bed_count" value={form.total_bed_count} onChange={handleChange} type="number" />
          <FormField label="Furnishing Level" name="furnishing_level" value={form.furnishing_level} onChange={handleChange} type="select" options={furnishingOptions} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Rooms" name="room_count" value={form.room_count} onChange={handleChange} type="number" />
          <FormField label="Bathrooms" name="bathroom_count" value={form.bathroom_count} onChange={handleChange} type="number" />
        </div>
        <FormField label="Demographic Focus" name="demographic_focus" value={form.demographic_focus} onChange={handleChange} placeholder="e.g., Veterans, Justice-Involved" />
        <FormField label="Compatible Demographics" name="compatible_demographics" value={form.compatible_demographics} onChange={handleChange} placeholder="Comma-separated list" />
        <div className="space-y-2">
          <p className="text-xs font-medium">Amenities</p>
          <div className="grid grid-cols-2 gap-2">
            <FormField label="Refrigerators" name="refrigerators" value={form.refrigerators} onChange={handleChange} type="checkbox" />
            <FormField label="Tech Room" name="tech_room" value={form.tech_room} onChange={handleChange} type="checkbox" />
            <FormField label="Gym Area" name="gym_area" value={form.gym_area} onChange={handleChange} type="checkbox" />
            <FormField label="Lockers" name="lockers" value={form.lockers} onChange={handleChange} type="checkbox" />
            <FormField label="Washer/Dryer" name="washer_dryer" value={form.washer_dryer} onChange={handleChange} type="checkbox" />
            <FormField label="Internet/Wi-Fi" name="internet_wifi" value={form.internet_wifi} onChange={handleChange} type="checkbox" />
            <FormField label="Parking" name="parking" value={form.parking} onChange={handleChange} type="checkbox" />
            <FormField label="ADA Accessible" name="ada_accessible" value={form.ada_accessible} onChange={handleChange} type="checkbox" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Visible to Partners" name="visible_to_partners" value={form.visible_to_partners} onChange={handleChange} type="checkbox" />
          <FormField label="Visible Publicly" name="visible_publicly" value={form.visible_publicly} onChange={handleChange} type="checkbox" />
        </div>
        <FormField label="House Manager Name" name="house_manager_name" value={form.house_manager_name} onChange={handleChange} />
        <FormField label="House Manager Email" name="house_manager_email" value={form.house_manager_email} onChange={handleChange} type="email" />
        <FormField label="House Manager Phone" name="house_manager_phone" value={form.house_manager_phone} onChange={handleChange} />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}