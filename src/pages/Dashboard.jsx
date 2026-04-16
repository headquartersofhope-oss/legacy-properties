import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import HouseCard from '@/components/HouseCard';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isInternal } = useCurrentUser();
  const [properties, setProperties] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [moveRequests, setMoveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        if (isInternal) {
          const [propsRes, refsRes, occRes, roomsRes, moveRes] = await Promise.all([
            base44.entities.Property.list(),
            base44.entities.HousingApplication.list(),
            base44.entities.OccupancyRecord.list(),
            base44.entities.Room.list(),
            base44.entities.MoveRequest.list(),
          ]);
          setProperties(propsRes || []);
          setReferrals(refsRes || []);
          setOccupancy(occRes || []);
          setRooms(roomsRes || []);
          setMoveRequests(moveRes || []);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadDashboardData();
  }, [user, isInternal]);

  const perBedProps = properties.filter((p) => p.housing_model === 'per_bed');
  const turnkeyProps = properties.filter((p) => p.housing_model === 'turnkey_house');

  const totalBeds = properties.reduce((sum, p) => sum + (p.total_bed_count || 0), 0);
  const occupiedBeds = occupancy.filter((o) => o.occupancy_status === 'active').length;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const fullHouses = properties.filter((p) => p.total_bed_count && p.total_bed_count - (occupancy.filter((o) => o.property_id === p.id && o.occupancy_status === 'active').length) === 0).length;
  const nearCapacity = properties.filter((p) => {
    const occupied = occupancy.filter((o) => o.property_id === p.id && o.occupancy_status === 'active').length;
    const total = p.total_bed_count || 0;
    return total > 0 && (occupied / total) >= 0.8 && occupied < total;
  }).length;

  const pendingReferrals = referrals.filter((r) => r.application_status === 'under_review' || r.application_status === 'pending_documents').length;
  const totalRooms = rooms.filter(r => r.status === 'active').length;
  const pendingMoves = moveRequests.filter(r => r.request_status === 'submitted' || r.request_status === 'under_review' || r.request_status === 'approved').length;

  const handleNavigate = (path, filters) => {
    sessionStorage.setItem('navigationFilters', JSON.stringify(filters));
    navigate(path);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Housing Command Center"
        subtitle={`${properties.length} properties • ${totalBeds} beds • Real-time operations`}
      />

      {!isInternal ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-6 text-center">
          <p className="text-sm text-amber-900">
            Partner dashboard view coming soon. Contact your account manager.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div onClick={() => handleNavigate('/properties', {})} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-blue-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Houses</div>
              <div className="text-2xl font-bold text-foreground group-hover:text-blue-500 transition-colors">{properties.length}</div>
              <div className="text-[10px] text-muted-foreground mt-2">Click to view all</div>
            </div>
            <div onClick={() => handleNavigate('/rooms', {})} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Rooms</div>
              <div className="text-2xl font-bold text-foreground group-hover:text-indigo-500 transition-colors">{totalRooms}</div>
              <div className="text-[10px] text-muted-foreground mt-2">All rooms</div>
            </div>
            <div onClick={() => handleNavigate('/beds', {})} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-purple-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Beds</div>
              <div className="text-2xl font-bold text-foreground group-hover:text-purple-500 transition-colors">{totalBeds}</div>
              <div className="text-[10px] text-muted-foreground mt-2">All beds</div>
            </div>
            <div onClick={() => handleNavigate('/beds', { status: 'available' })} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-green-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Available</div>
              <div className="text-2xl font-bold text-foreground group-hover:text-green-500 transition-colors">{availableBeds}</div>
              <div className="text-[10px] text-muted-foreground mt-2">Ready for placement</div>
            </div>
            <div onClick={() => handleNavigate('/occupancy', {})} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-orange-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Occupancy</div>
              <div className="text-2xl font-bold text-foreground group-hover:text-orange-500 transition-colors">{occupancyPercent}%</div>
              <div className="text-[10px] text-muted-foreground mt-2">Utilization</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div onClick={() => handleNavigate('/properties', { occupancy_level: 'full' })} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-red-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> At Capacity</div>
              <div className="text-2xl font-bold text-red-600 group-hover:text-red-700 transition-colors">{fullHouses}</div>
              <div className="text-[10px] text-muted-foreground mt-2">100% occupied</div>
            </div>
            <div onClick={() => handleNavigate('/properties', { occupancy_level: 'near' })} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Near Capacity</div>
              <div className="text-2xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors">{nearCapacity}</div>
              <div className="text-[10px] text-muted-foreground mt-2">80%+ occupied</div>
            </div>
            <div onClick={() => handleNavigate('/referrals', { status: 'under_review' })} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-sky-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Pending</div>
              <div className="text-2xl font-bold text-sky-600 group-hover:text-sky-700 transition-colors">{pendingReferrals}</div>
              <div className="text-[10px] text-muted-foreground mt-2">Referrals awaiting action</div>
            </div>
            <div onClick={() => handleNavigate('/move-requests', {})} className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-violet-400 transition-all cursor-pointer group">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Move Requests</div>
              <div className={`text-2xl font-bold transition-colors ${pendingMoves > 0 ? 'text-violet-600 group-hover:text-violet-700' : 'text-foreground group-hover:text-violet-500'}`}>{pendingMoves}</div>
              <div className="text-[10px] text-muted-foreground mt-2">Pending action</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div onClick={() => handleNavigate('/properties', { housing_model: 'per_bed' })} className="bg-card rounded-lg border-2 border-indigo-200 bg-indigo-50 p-6 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-foreground group-hover:text-indigo-600 transition-colors">PER-BED PROPERTIES</h3>
              </div>
              <div className="text-3xl font-bold text-indigo-700 mb-2">{perBedProps.length}</div>
              <div className="text-sm text-muted-foreground">{perBedProps.reduce((sum, p) => sum + (p.total_bed_count || 0), 0)} beds configured</div>
            </div>
            <div onClick={() => handleNavigate('/properties', { housing_model: 'turnkey_house' })} className="bg-card rounded-lg border-2 border-amber-200 bg-amber-50 p-6 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-foreground group-hover:text-amber-600 transition-colors">TURNKEY PROPERTIES</h3>
              </div>
              <div className="text-3xl font-bold text-amber-700 mb-2">{turnkeyProps.length}</div>
              <div className="text-sm text-muted-foreground">Whole-house leases</div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">PROPERTIES</h2>
            {properties.length === 0 ? (
              <div className="bg-card rounded-lg border-2 border-border p-12 text-center">
                <p className="text-muted-foreground">No properties configured yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((property) => (
                  <HouseCard
                    key={property.id}
                    property={property}
                    occupied_beds={occupancy.filter((o) => o.property_id === property.id && o.occupancy_status === 'active').length}
                    onClick={() => navigate(`/property/${property.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}