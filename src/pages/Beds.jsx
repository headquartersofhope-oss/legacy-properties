import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import DataTable from '@/components/DataTable';
import BedAssignment from '@/components/BedAssignment';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';

function cleaningDuration(startedAt) {
  if (!startedAt) return null;
  const mins = Math.round((Date.now() - new Date(startedAt)) / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export default function Beds() {
  const { user, isInternal } = useCurrentUser();
  const [beds, setBeds] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assigningBed, setAssigningBed] = useState(null);
  const [markingReady, setMarkingReady] = useState(null);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!isInternal) return <AccessDenied />;

  const filteredBeds = beds.filter(b => {
    if (filterSite !== 'all' && b.site_id !== filterSite) return false;
    if (filterStatus !== 'all' && b.bed_status !== filterStatus) return false;
    return true;
  });

  const reloadBeds = async () => {
    const res = await base44.entities.Bed.list();
    setBeds(res || []);
  };

  const handleMarkReady = async (bedId) => {
    setMarkingReady(bedId);
    try {
      await base44.functions.invoke('markBedReady', { bed_id: bedId });
      await reloadBeds();
    } finally {
      setMarkingReady(null);
    }
  };

  const columns = [
    { header: 'Bed Label', accessor: 'bed_label' },
    { header: 'Room', accessor: 'room_name' },
    { header: 'Property', accessor: 'site_name' },
    { header: 'Type', cell: (row) => <span className="capitalize text-xs">{row.bed_type?.replace('_', ' ') || '—'}</span> },
    { header: 'Status', cell: (row) => (
      <div className="flex items-center gap-2">
        <StatusBadge status={row.bed_status} />
        {row.bed_status === 'needs_cleaning' && row.cleaning_started_at && (
          <span className="text-xs text-amber-600 font-medium">{cleaningDuration(row.cleaning_started_at)}</span>
        )}
      </div>
    )},
    {
      header: 'Actions',
      cell: (row) => {
        if (row.bed_status === 'available' && row.status === 'active') {
          return (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={(e) => { e.stopPropagation(); setAssigningBed(row); }}>
              Assign
            </Button>
          );
        }
        if (row.bed_status === 'needs_cleaning') {
          return (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
              disabled={markingReady === row.id}
              onClick={(e) => { e.stopPropagation(); handleMarkReady(row.id); }}
            >
              {markingReady === row.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Mark Ready
            </Button>
          );
        }
        return null;
      }
    },
  ];

  const available = beds.filter(b => b.bed_status === 'available').length;
  const occupied = beds.filter(b => b.bed_status === 'occupied').length;
  const needsCleaning = beds.filter(b => b.bed_status === 'needs_cleaning').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Beds"
        subtitle={`${beds.length} total • ${available} available • ${occupied} occupied${needsCleaning > 0 ? ` • ${needsCleaning} needs cleaning` : ''}`}
      />

      <div className="flex gap-3 flex-wrap">
        <Select value={filterSite} onValueChange={setFilterSite}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Properties" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            {properties.map(p => <SelectItem key={p.id} value={p.id}>{p.property_name || p.site_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="needs_cleaning">Needs Cleaning</SelectItem>
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

      {assigningBed && (
        <BedAssignment
          bed={assigningBed}
          onClose={() => setAssigningBed(null)}
          onSuccess={() => { setAssigningBed(null); reloadBeds(); }}
        />
      )}
    </div>
  );
}