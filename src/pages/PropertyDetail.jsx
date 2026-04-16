import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import AccessDenied from '@/components/AccessDenied';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export default function PropertyDetail() {
  const { id } = useParams();
  const { user, isInternal } = useCurrentUser();
  const [property, setProperty] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
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
    load();
  }, [user, id]);

  if (!isInternal) return <AccessDenied />;

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!property) return <div className="text-center py-12 text-muted-foreground">Property not found.</div>;

  const available = beds.filter(b => b.bed_status === 'available').length;
  const occupied = beds.filter(b => b.bed_status === 'occupied').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/properties">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </Link>
        <PageHeader title={property.property_name} subtitle={property.full_address || property.city} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Beds', value: beds.length },
          { label: 'Available', value: available },
          { label: 'Occupied', value: occupied },
          { label: 'Rooms', value: rooms.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border-2 border-border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{value}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border-2 border-border rounded-lg p-4 space-y-2">
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

      <div className="bg-card border-2 border-border rounded-lg p-4">
        <h2 className="font-semibold text-foreground mb-3">Rooms ({rooms.length})</h2>
        {rooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms configured.</p>
        ) : (
          <div className="space-y-2">
            {rooms.map(room => {
              const roomBeds = beds.filter(b => b.room_id === room.id);
              const roomOccupied = roomBeds.filter(b => b.bed_status === 'occupied').length;
              return (
                <div key={room.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <span className="font-medium text-sm">{room.room_name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{roomOccupied}/{roomBeds.length} occupied</span>
                  </div>
                  <StatusBadge status={room.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}