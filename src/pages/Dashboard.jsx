import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import KPIStrip from '@/components/KPIStrip';
import OperationsPanel from '@/components/OperationsPanel';
import HouseCard from '@/components/HouseCard';
import { BarChart3, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { user, isInternal } = useCurrentUser();
  const [properties, setProperties] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        if (isInternal) {
          const [propsRes, refsRes, occRes] = await Promise.all([
            base44.entities.Property.list(),
            base44.entities.HousingApplication.list(),
            base44.entities.OccupancyRecord.list(),
          ]);
          setProperties(propsRes || []);
          setReferrals(refsRes || []);
          setOccupancy(occRes || []);
        }
      } catch (error) {
        console.error('Dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadDashboardData();
  }, [user, isInternal]);

  // Compute metrics
  const perBedProps = properties.filter((p) => p.housing_model === 'per_bed');
  const turnkeyProps = properties.filter((p) => p.housing_model === 'turnkey_house');
  
  const totalBeds = perBedProps.reduce((sum, p) => sum + (p.total_bed_count || 0), 0);
  const occupiedBeds = occupancy.filter((o) => o.occupancy_status === 'active').length;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  const fullHouses = perBedProps.filter((p) => p.total_bed_count && p.total_bed_count - (occupancy.filter((o) => o.site_id === p.id && o.occupancy_status === 'active').length) === 0).length;
  const nearCapacity = perBedProps.filter((p) => {
    const occupied = occupancy.filter((o) => o.site_id === p.id && o.occupancy_status === 'active').length;
    const total = p.total_bed_count || 0;
    return total > 0 && (occupied / total) >= 0.8 && occupied < total;
  }).length;

  const pendingReferrals = referrals.filter((r) => r.application_status === 'under_review' || r.application_status === 'pending_documents').length;

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {/* KPI Strip */}
          <KPIStrip
            totalHouses={properties.length}
            totalBeds={totalBeds}
            availableBeds={availableBeds}
            occupancyPercent={occupancyPercent}
            loading={loading}
          />

          {/* Operations Panel */}
          <OperationsPanel
            fullHouses={fullHouses}
            nearCapacity={nearCapacity}
            pendingReferrals={pendingReferrals}
            diagnosticWarnings={0}
            loading={loading}
          />

          {/* Housing Model Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card rounded-lg border-2 border-indigo-200 bg-indigo-50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-foreground">PER-BED PROPERTIES</h3>
              </div>
              <div className="text-3xl font-bold text-indigo-700 mb-2">{perBedProps.length}</div>
              <div className="text-sm text-muted-foreground">
                {totalBeds} beds • {availableBeds} available
              </div>
            </div>
            <div className="bg-card rounded-lg border-2 border-amber-200 bg-amber-50 p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-foreground">TURNKEY PROPERTIES</h3>
              </div>
              <div className="text-3xl font-bold text-amber-700 mb-2">{turnkeyProps.length}</div>
              <div className="text-sm text-muted-foreground">
                Whole-house leases (client-managed)
              </div>
            </div>
          </div>

          {/* House Grid */}
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
                    occupied_beds={occupancy.filter((o) => o.site_id === property.id && o.occupancy_status === 'active').length}
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