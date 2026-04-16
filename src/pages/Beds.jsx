import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/DataTable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Beds() {
  const { user, isInternal } = useCurrentUser();
  const [beds, setBeds] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [bedsRes, propsRes] = await Promise.all([
        base44.entities.Bed.list(),
        base44.entities.Property.list(),
      ]);
      setBeds(bedsRes || []);
      setProperties(propsRes || []);
      setLoading(false);
    };
    load();
  }, [user]);

  if (!isInternal) return <AccessDenied />;

  const filteredBeds = beds.filter(b => {
    if (filterSite !== 'all' && b.site_id !== filterSite) return false;
    if (filterStatus !== 'all' && b.bed_status !== filterStatus) return false;
    return true;
  });

  const columns = [
    { header: 'Bed Label', accessor: 'bed_label' },
    { header: 'Room', accessor: 'room_name' },
    { header: 'Property', accessor: 'site_name' },
    { header: 'Type', cell: (row) => <span className="capitalize text-xs">{row.bed_type?.replace('_', ' ') || '—'}</span> },
    { header: 'Status', cell: (row) => <StatusBadge status={row.bed_status} /> },
    { header: 'Active', cell: (row) => <StatusBadge status={row.status} /> },
    { header: 'Notes', cell: (row) => <span className="text-xs text-muted-foreground">{row.notes || '—'}</span> },
  ];

  const available = beds.filter(b => b.bed_status === 'available').length;
  const occupied = beds.filter(b => b.bed_status === 'occupied').length;

  return (
    <div className="space-y-4">
      <PageHeader title="Beds" subtitle={`${beds.length} total • ${available} available • ${occupied} occupied`} />

      <div className="flex gap-3 flex-wrap">
        <Select value={filterSite} onValueChange={setFilterSite}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Properties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name || p.site_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="out_of_service">Out of Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={filteredBeds} emptyMessage="No beds found." />
      )}
    </div>
  );
}