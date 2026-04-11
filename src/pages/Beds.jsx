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

export default function Beds() {
  const { isAdmin, isManager } = useCurrentUser();
  const [beds, setBeds] = useState([]);
  const [sites, setSites] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', site_name: '', room_id: '', room_name: '', bed_label: '', bed_status: 'available', bed_type: 'standard', status: 'active', restriction_tags: '', notes: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [b, s, r] = await Promise.all([base44.entities.Bed.list('-created_date'), base44.entities.HousingSite.list(), base44.entities.Room.list()]);
    setBeds(b);
    setSites(s.filter(x => x.status === 'active'));
    setRooms(r.filter(x => x.status === 'active'));
    setLoading(false);
  }

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'site_id') {
        const site = sites.find(s => s.id === value);
        next.site_name = site?.site_name || '';
        next.room_id = ''; next.room_name = '';
        setFilteredRooms(rooms.filter(r => r.site_id === value));
      }
      if (name === 'room_id') {
        const room = rooms.find(r => r.id === value);
        next.room_name = room?.room_name || '';
      }
      return next;
    });
  }

  function openNew() {
    setForm({ site_id: '', site_name: '', room_id: '', room_name: '', bed_label: '', bed_status: 'available', bed_type: 'standard', status: 'active', restriction_tags: '', notes: '' });
    setEditId(null); setFilteredRooms([]); setShowForm(true);
  }

  function openEdit(bed) {
    setForm({ ...bed }); setEditId(bed.id);
    setFilteredRooms(rooms.filter(r => r.site_id === bed.site_id));
    setShowForm(true);
  }

  async function handleSubmit() {
    setSaving(true);
    if (editId) await base44.entities.Bed.update(editId, form);
    else await base44.entities.Bed.create(form);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  const columns = [
    { header: "Bed Label", accessor: "bed_label" },
    { header: "Site", accessor: "site_name" },
    { header: "Room", accessor: "room_name" },
    { header: "Bed Status", cell: r => <StatusBadge status={r.bed_status} /> },
    { header: "Type", cell: r => <StatusBadge status={r.bed_type} /> },
    { header: "Active", cell: r => <StatusBadge status={r.status} /> },
  ];

  const bedStatusOptions = [
    { value: 'available', label: 'Available' }, { value: 'occupied', label: 'Occupied' },
    { value: 'reserved', label: 'Reserved' }, { value: 'out_of_service', label: 'Out of Service' },
  ];
  const bedTypeOptions = [
    { value: 'standard', label: 'Standard' }, { value: 'bunk_top', label: 'Bunk Top' },
    { value: 'bunk_bottom', label: 'Bunk Bottom' }, { value: 'single', label: 'Single' }, { value: 'double', label: 'Double' },
  ];

  return (
    <div>
      <PageHeader title="Beds" subtitle="Manage beds across all sites and rooms">
        {(isAdmin || isManager) && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Bed</Button>}
      </PageHeader>
      {loading ? <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div> : <DataTable columns={columns} data={beds} onRowClick={(isAdmin || isManager) ? openEdit : undefined} />}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Bed" : "Add Bed"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Site" name="site_id" value={form.site_id} onChange={handleChange} type="select" options={sites.map(s => ({ value: s.id, label: s.site_name }))} required />
        <FormField label="Room" name="room_id" value={form.room_id} onChange={handleChange} type="select" options={filteredRooms.map(r => ({ value: r.id, label: r.room_name }))} required />
        <FormField label="Bed Label" name="bed_label" value={form.bed_label} onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Bed Status" name="bed_status" value={form.bed_status} onChange={handleChange} type="select" options={bedStatusOptions} />
          <FormField label="Bed Type" name="bed_type" value={form.bed_type} onChange={handleChange} type="select" options={bedTypeOptions} />
        </div>
        <FormField label="Active Status" name="status" value={form.status} onChange={handleChange} type="select" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        <FormField label="Restriction Tags" name="restriction_tags" value={form.restriction_tags} onChange={handleChange} placeholder="e.g., wheelchair_accessible, ground_floor" />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}