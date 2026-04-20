import { MapPin, Users, AlertCircle } from 'lucide-react';

export default function HouseCard({ property, occupied_beds, onClick }) {
  const totalBeds = property.total_bed_count || 0;
  const occupiedBeds = occupied_beds || 0;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  const isFull = totalBeds > 0 && availableBeds === 0;
  const nearCapacity = totalBeds > 0 && occupancyPercent >= 80;

  return (
    <div
      onClick={onClick}
      className="bg-card border-t-2 border-primary from-primary/8 bg-gradient-to-br to-card rounded-lg p-4 cursor-pointer shadow-sm hover:shadow-lg transition-all group"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-base text-heading group-hover:text-primary transition-colors">
              {property.property_name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-label">
              <MapPin className="w-3 h-3" />
              <span>{property.city || 'N/A'}</span>
            </div>
          </div>
          {isFull && <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0" />}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-primary/20 text-primary">
            {property.housing_model?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
          </span>
          <span className="text-xs font-medium px-2 py-1 rounded bg-elevated text-body-text">
            {property.property_type?.replace(/_/g, ' ') || 'Housing'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3">
        {/* Bed Inventory */}
        {property.housing_model === 'per_bed' && totalBeds > 0 && (
          <>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold text-muted-label uppercase tracking-wider">Available</span>
                <span className={`text-2xl font-bold ${availableBeds > 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {availableBeds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${occupancyPercent >= 80 ? 'bg-accent-amber' : 'bg-accent-emerald'}`}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-label whitespace-nowrap">{Math.round(occupancyPercent)}%</span>
              </div>
            </div>

            {/* Bed Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-card-border">
              <div className="text-center">
                <div className="text-sm font-bold text-white">{totalBeds}</div>
                <div className="text-xs text-muted-label">Total</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-white">{occupiedBeds}</div>
                <div className="text-xs text-muted-label">Occupied</div>
              </div>
            </div>
          </>
        )}

        {/* Turnkey Status */}
        {property.housing_model === 'turnkey_house' && (
          <div className="py-2 px-3 bg-accent-amber/10 border border-card-border rounded-md">
            <div className="text-xs font-semibold text-accent-amber mb-1">FULL HOUSE LEASE</div>
            {property.turnkey_client_name && (
              <div className="text-xs text-body-text">{property.turnkey_client_name}</div>
            )}
          </div>
        )}

        {/* Empty State */}
        {totalBeds === 0 && (
          <div className="py-4 text-center">
            <Users className="w-8 h-8 text-muted-label/30 mx-auto mb-2" />
            <div className="text-xs text-muted-label">Beds not configured</div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pt-2 border-t border-card-border">
          <div className={`w-2 h-2 rounded-full ${property.house_status === 'active' ? 'bg-accent-emerald' : 'bg-accent-slate'}`} />
          <span className="text-xs font-medium text-muted-label capitalize">{property.house_status || 'inactive'}</span>
        </div>
      </div>

      {/* Footer Action */}
      {property.housing_model === 'per_bed' && (
        <div className="px-0 py-3 border-t border-card-border mt-3">
          <button className="w-full text-xs font-semibold text-primary hover:text-primary-dark transition-colors">
            View Beds →
          </button>
        </div>
      )}
    </div>
  );
}