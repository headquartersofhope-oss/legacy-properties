import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import BedAssignment from '@/components/BedAssignment';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, UserPlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Rooms() {
  const { user, isInternal } = useCurrentUser();
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [filterSite, setFilterSite] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [assigningBed, setAssigningBed] = useState(null);

  const load = async () => {
    const [roomsRes, bedsRes, propsRes] = await Promise.all([
      base44.entities.Room.list(),
      base44.entities.Bed.list(),
      base44.entities.Property.list(),
    ]);
    setRooms(roomsRes || []);
    setBeds(bedsRes || []);
    setProperties(propsRes || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    load();
  }, [user]);

  if (!isInternal) return <AccessDenied />;

  const toggleRoom = (id) => setExpandedRooms(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredRooms = rooms.filter(r => {
    if (filterSite !== 'all' && r.site_id !== filterSite) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    return true;
  });

  const getRoomBeds = (roomId) => beds.filter(b => b.room_id === roomId);

  const bedStatusColor = (status) => {
    if (status === 'available') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'occupied') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (status === 'reserved') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Rooms" subtitle={`${rooms.length} total rooms`} />

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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="under_maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card border-2 border-border rounded-lg">No rooms found.</div>
      ) : (
        <div className="space-y-2">
          {filteredRooms.map(room => {
            const roomBeds = getRoomBeds(room.id);
            const occupiedCount = roomBeds.filter(b => b.bed_status === 'occupied').length;
            const isOpen = expandedRooms[room.id];
            return (
              <div key={room.id} className="bg-card border-2 border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleRoom(room.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <div className="font-semibold text-foreground">{room.room_name}</div>
                      <div className="text-xs text-muted-foreground">{room.site_name || 'No property'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{occupiedCount}/{roomBeds.length} occupied</span>
                    <StatusBadge status={room.status} />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border pt-3">
                    {roomBeds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No beds in this room.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {roomBeds.map(bed => (
                          <div key={bed.id} className={`border rounded-lg p-3 text-xs ${bedStatusColor(bed.bed_status)}`}>
                            <div className="font-semibold">{bed.bed_label}</div>
                            <div className="capitalize mt-0.5">{bed.bed_status?.replace('_', ' ')}</div>
                            {bed.bed_type && <div className="text-[10px] mt-0.5 opacity-70">{bed.bed_type}</div>}
                            {bed.bed_status === 'available' && (
                              <Button
                                size="sm"
                                className="w-full mt-2 h-6 text-[11px] gap-1 px-1"
                                onClick={(e) => { e.stopPropagation(); setAssigningBed(bed); }}
                              >
                                <UserPlus className="w-3 h-3" /> Assign
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {room.notes && <p className="text-xs text-muted-foreground mt-3 italic">{room.notes}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {assigningBed && (
        <BedAssignment
          bed={assigningBed}
          onClose={() => setAssigningBed(null)}
          onSuccess={() => { setAssigningBed(null); load(); }}
        />
      )}
    </div>
  );
}