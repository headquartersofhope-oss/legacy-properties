import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isInternal } = useCurrentUser();
  const [property, setProperty] = useState(null);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [prop, occ] = await Promise.all([
          base44.entities.Property.get(id),
          base44.entities.OccupancyRecord.filter({ property_id: id }),
        ]);
        setProperty(prop);
        setOccupancy(occ || []);
      } catch (error) {
        console.error('PropertyDetail load error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isInternal) load();
  }, [id, isInternal]);

  if (!isInternal) return null;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
  }

  if (!property) {
    return <div className="text-center py-12 text-muted-foreground">Property not found</div>;
  }

  const activeOccupancy = occupancy.filter(o => o.occupancy_status === 'active').length;
  const occupancyPercent = property.total_bed_count ? Math.round((activeOccupancy / property.total_bed_count) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/properties')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <PageHeader title={property.property_name} subtitle={`${property.city}, ${property.state}`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overview */}
        <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-foreground">Overview</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{property.full_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Housing Model</span>
              <span className="font-medium">{property.housing_model === 'per_bed' ? 'Per-Bed' : 'Turnkey'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{property.property_type?.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium capitalize">{property.house_status}</span>
            </div>
          </div>
        </div>

        {/* Occupancy */}
        <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-foreground">Occupancy</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Beds</span>
              <span className="font-medium">{property.total_bed_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Occupied</span>
              <span className="font-medium">{activeOccupancy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-green-600">{(property.total_bed_count || 0) - activeOccupancy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Utilization</span>
              <span className={`font-bold ${occupancyPercent >= 80 ? 'text-amber-600' : occupancyPercent >= 50 ? 'text-blue-600' : 'text-green-600'}`}>
                {occupancyPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Capacity Metrics */}
      <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-foreground">Facility Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground text-xs">Rooms</div>
            <div className="font-bold text-lg">{property.room_count || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Bathrooms</div>
            <div className="font-bold text-lg">{property.bathroom_count || 0}</div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs">Kitchens</div>
            <div className="font-bold text-lg">{property.kitchen_count || 0}</div>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4">
        <h3 className="font-bold text-foreground">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {property.refrigerators && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Refrigerators</div>}
          {property.washer_dryer && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Washer/Dryer</div>}
          {property.internet_wifi && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> WiFi</div>}
          {property.parking && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Parking</div>}
          {property.gym_area && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Gym</div>}
          {property.lockers && <div className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Lockers</div>}
        </div>
      </div>
    </div>
  );
}