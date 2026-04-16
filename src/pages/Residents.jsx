import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/DataTable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BedAssignment from '@/components/BedAssignment';

export default function Residents() {
  const { user, isInternal } = useCurrentUser();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [assigningResident, setAssigningResident] = useState(null);

  const load = async () => {
    const res = await base44.entities.HousingResident.list();
    setResidents(res || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  if (!isInternal) return <AccessDenied />;

  const filtered = residents.filter(r => filterStatus === 'all' || r.resident_status === filterStatus);

  const columns = [
    { header: 'Name', cell: (r) => <span className="font-medium">{r.first_name} {r.last_name}</span> },
    { header: 'Status', cell: (r) => <StatusBadge status={r.resident_status} /> },
    { header: 'Property', cell: (r) => <span className="text-sm">{r.site_name || '—'}</span> },
    { header: 'Room', cell: (r) => <span className="text-sm">{r.room_name || '—'}</span> },
    { header: 'Bed', cell: (r) => <span className="text-sm">{r.bed_label || '—'}</span> },
    { header: 'Move-In', cell: (r) => <span className="text-sm">{r.move_in_date || '—'}</span> },
    {
      header: 'Actions',
      cell: (r) => (
        ['active', 'pending_move_in'].includes(r.resident_status) ? (
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setAssigningResident(r); }}>
            {r.bed_id ? 'Reassign Bed' : 'Assign Bed'}
          </Button>
        ) : null
      )
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Residents" subtitle={`${residents.length} total residents`} />

      <div className="flex gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_move_in">Pending Move-In</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="exited">Exited</SelectItem>
            <SelectItem value="discharged">Discharged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <DataTable columns={columns} data={filtered} emptyMessage="No residents found." />
      )}

      {assigningResident && (
        <BedAssignment
          resident={assigningResident}
          onClose={() => setAssigningResident(null)}
          onSuccess={() => { setAssigningResident(null); load(); }}
          onAssigned={() => { setAssigningResident(null); load(); }}
        />
      )}
    </div>
  );
}