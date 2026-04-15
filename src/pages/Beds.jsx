import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FormModal from "@/components/FormModal";
import FormField from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Plus, Bed, Filter, X } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Beds() {
  const { isAdmin, isManager, isInternal } = useCurrentUser();
  const [beds, setBeds] = useState([]);
  const [sites, setSites] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ site_id: '', site_name: '', room_id: '', room_name: '', bed_label: '', bed_status: 'available', bed_type: 'standard', status: 'active', restriction_tags: '', notes: '' });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);

  useEffect(() => { 
    load();
    
    // Load navigation filters from session
    const navFilters = sessionStorage.getItem('navigationFilters');
    if (navFilters) {
      const filters = JSON.parse(navFilters);
      if (filters.status) setStatusFilter(filters.status);
      sessionStorage.removeItem('navigationFilters');
    }
  }, []);

  if (!isInternal) return null;

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

  // Apply filters
  let displayedBeds = beds;
  if (statusFilter) {
    displayedBeds = displayedBeds.filter(b => b.bed_status === statusFilter);
  }
  if (activeFilter) {
    displayedBeds = displayedBeds.filter(b => b.status === activeFilter);
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

  const hasActiveFilters = statusFilter || activeFilter;

  return (
    <div className="space-y-6">
      <PageHeader title="Beds" subtitle={`${displayedBeds.length} of ${beds.length} beds`}>
        {(isAdmin || isManager) && <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Bed</Button>}
      </PageHeader>

      {/* Filters */}
      {beds.length > 0 && (
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <div className="space-y-3">
            {hasActiveFilters && (
              <div className="text-xs text-muted-foreground font-medium">
                Filters active ({(statusFilter ? 1 : 0) + (activeFilter ? 1 : 0)})
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <Select value={statusFilter || ""} onValueChange={(v) => setStatusFilter(v || null)}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Bed Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Status</SelectItem>
                    {bedStatusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1">
                <Select value={activeFilter || ""} onValueChange={(v) => setActiveFilter(v || null)}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="Active Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>All Active</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setStatusFilter(null); setActiveFilter(null); }}
                  className="h-8 text-xs"
                >
                  <X className="w-3 h-3 mr-1" /> Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : beds.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No beds configured"
          description="Beds must be assigned to rooms inside a house. Create rooms first, then add beds."
          actionLabel="Create Bed"
          onAction={openNew}
        />
      ) : displayedBeds.length === 0 ? (
        <EmptyState
          icon={Bed}
          title="No beds match your filters"
          description="Try adjusting your filters to see more beds."
          actionLabel="Clear filters"
          onAction={() => { setStatusFilter(null); setActiveFilter(null); }}
        />
      ) : (
        <DataTable columns={columns} data={displayedBeds} onRowClick={(isAdmin || isManager) ? openEdit : undefined} />
      )}

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