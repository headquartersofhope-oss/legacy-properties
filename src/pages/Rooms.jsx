import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FormModal from "@/components/FormModal";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Plus, DoorOpen } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function Rooms() {
  const { isAdmin, isManager, isInternal } = useCurrentUser();
  const [rooms, setRooms] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', site_name: '', room_name: '', capacity: '', status: 'active', notes: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  if (!isInternal) return null;

  async function load() {
    const [r, s] = await Promise.all([base44.entities.Room.list('-created_date'), base44.entities.HousingSite.list()]);
    setRooms(r);
    setSites(s.filter(x => x.status === 'active'));
    setLoading(false);
  }

  function handleChange(name, value) {
    setForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'site_id') {
        const site = sites.find(s => s.id === value);
        next.site_name = site?.site_name || '';
      }
      return next;
    });
  }

  function openEdit(room) { setForm({ ...room }); setEditId(room.id); setShowForm(true); }

  async function handleSubmit() {
    setSaving(true);
    const payload = { ...form, capacity: Number(form.capacity) || 0 };
    if (editId) await base44.entities.Room.update(editId, payload);
    else await base44.entities.Room.create(payload);
    setSaving(false); setShowForm(false); setEditId(null); load();
  }

  const columns = [
    { header: "Room", accessor: "room_name" },
    { header: "Site", accessor: "site_name" },
    { header: "Capacity", accessor: "capacity" },
    { header: "Status", cell: r => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Rooms" subtitle="Manage rooms within housing sites">
        {(isAdmin || isManager) && (
          <Button onClick={() => { setForm({ site_id: '', site_name: '', room_name: '', capacity: '', status: 'active', notes: '' }); setEditId(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Room
          </Button>
        )}
      </PageHeader>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : rooms.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="No rooms configured"
          description="Rooms are where beds are assigned. Create a room first, then add beds within it."
          actionLabel="Create Room"
          onAction={() => { setForm({ site_id: '', site_name: '', room_name: '', capacity: '', status: 'active', notes: '' }); setEditId(null); setShowForm(true); }}
        />
      ) : (
        <DataTable columns={columns} data={rooms} onRowClick={(isAdmin || isManager) ? openEdit : undefined} />
      )}

      <FormModal open={showForm} onClose={() => setShowForm(false)} title={editId ? "Edit Room" : "Add Room"} onSubmit={handleSubmit} loading={saving}>
        <FormField label="Site" name="site_id" value={form.site_id} onChange={handleChange} type="select" options={sites.map(s => ({ value: s.id, label: s.site_name }))} required />
        <FormField label="Room Name/Number" name="room_name" value={form.room_name} onChange={handleChange} required />
        <FormField label="Capacity" name="capacity" value={form.capacity} onChange={handleChange} type="number" />
        <FormField label="Status" name="status" value={form.status} onChange={handleChange} type="select" options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'under_maintenance', label: 'Under Maintenance' }]} />
        <FormField label="Notes" name="notes" value={form.notes} onChange={handleChange} type="textarea" />
      </FormModal>
    </div>
  );
}