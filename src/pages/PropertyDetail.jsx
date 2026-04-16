import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import BedAssignment from '@/components/BedAssignment';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronRight, UserPlus, BedDouble } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user, isInternal } = useCurrentUser();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [assigningBed, setAssigningBed] = useState(null); // bed object for bed-first assignment

  const load = async () => {
    const [props, roomsRes, bedsRes] = await Promise.all([
      base44.entities.Property.filter({ id }),
      base44.entities.Room.filter({ site_id: id }),
      base44.entities.Bed.filter({ site_id: id }),
    ]);
    setProperty(props?.[0] || null);
    setRooms(roomsRes || []);
    setBeds(bedsRes || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user || !id) return;
    load();
  }, [user, id]);

  if (!isInternal) return <AccessDenied />;
  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!property) return <div className="text-center py-12 text-muted-foreground">Property not found.</div>;

  const available = beds.filter(b => b.bed_status === 'available').length;
  const occupied = beds.filter(b => b.bed_status === 'occupied').length;

  const toggleRoom = (roomId) => setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }));

  const bedStatusColor = (status) => {
    if (status === 'available') return 'bg-green-50 border-green-300 text-green-800';
    if (status === 'occupied') return 'bg-blue-50 border-blue-300 text-blue-800';
    if (status === 'reserved') return 'bg-purple-50 border-purple-300 text-purple-800';
    return 'bg-gray-50 border-gray-200 text-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/properties">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <PageHeader title={property.property_name} subtitle={property.full_address || property.city} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Beds', value: beds.length },
          { label: 'Available', value: available, color: 'text-green-600' },
          { label: 'Occupied', value: occupied, color: 'text-blue-600' },
          { label: 'Rooms', value: rooms.length },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border-2 border-border rounded-lg p-4 text-center">
            <div className={`text-2xl font-bold ${color || 'text-foreground'}`}>{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Property Details */}
      <div className="bg-card border-2 border-border rounded-lg p-4">
        <h2 className="font-semibold text-foreground mb-3">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div><span className="text-muted-foreground">Status: </span><StatusBadge status={property.house_status} /></div>
          <div><span className="text-muted-foreground">Type: </span>{property.property_type?.replace(/_/g, ' ') || '—'}</div>
          <div><span className="text-muted-foreground">Model: </span>{property.housing_model?.replace(/_/g, ' ') || '—'}</div>
          <div><span className="text-muted-foreground">Gender: </span>{property.gender_restriction?.replace(/_/g, ' ') || '—'}</div>
          <div><span className="text-muted-foreground">Manager: </span>{property.house_manager_name || '—'}</div>
          <div><span className="text-muted-foreground">Phone: </span>{property.house_manager_phone || '—'}</div>
        </div>
        {property.notes && <p className="text-xs text-muted-foreground italic mt-2">{property.notes}</p>}
      </div>

      {/* Rooms & Beds — with Assign buttons */}
      <div className="bg-card border-2 border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Rooms & Beds</h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{available} available</span>
            <span>·</span>
            <span className="text-blue-600 font-medium">{occupied} occupied</span>
            <span>·</span>
            <span>{beds.length} total</span>
          </div>
        </div>

        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">No rooms configured for this property.</p>
        ) : (
          <div className="divide-y divide-border">
            {rooms.map(room => {
              const roomBeds = beds.filter(b => b.room_id === room.id);
              const roomOccupied = roomBeds.filter(b => b.bed_status === 'occupied').length;
              const roomAvail = roomBeds.filter(b => b.bed_status === 'available').length;
              const isOpen = expandedRooms[room.id] !== false; // default expanded

              return (
                <div key={room.id}>
                  {/* Room header row */}
                  <button
                    onClick={() => toggleRoom(room.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="font-medium text-sm">{room.room_name}</span>
                      <span className="text-xs text-muted-foreground">{roomOccupied}/{roomBeds.length} occupied</span>
                      {roomAvail > 0 && (
                        <span className="text-xs text-green-600 font-semibold">{roomAvail} open</span>
                      )}
                    </div>
                    <StatusBadge status={room.status} />
                  </button>

                  {/* Bed grid */}
                  {isOpen && (
                    <div className="px-4 pb-4 bg-muted/10">
                      {roomBeds.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No beds in this room.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                          {roomBeds.map(bed => (
                            <div key={bed.id} className={`border rounded-lg p-3 ${bedStatusColor(bed.bed_status)}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-sm flex items-center gap-1">
                                  <BedDouble className="w-3.5 h-3.5" />
                                  {bed.bed_label}
                                </span>
                                <StatusBadge status={bed.bed_status} />
                              </div>
                              {bed.bed_type && (
                                <div className="text-[11px] opacity-70 capitalize">{bed.bed_type.replace(/_/g, ' ')}</div>
                              )}
                              {bed.notes && (
                                <div className="text-[11px] opacity-60 mt-0.5 truncate">{bed.notes}</div>
                              )}
                              {bed.bed_status === 'available' && (
                                <Button
                                  size="sm"
                                  className="w-full mt-2 h-7 text-xs gap-1 bg-primary/90 hover:bg-primary"
                                  onClick={() => setAssigningBed(bed)}
                                >
                                  <UserPlus className="w-3 h-3" /> Assign Resident
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
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