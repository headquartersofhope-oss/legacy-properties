import { Home, MapPin, Users, AlertCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeColors = {
  transitional_housing: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  sober_living: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  veteran_house: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700' },
  justice_reentry: { bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
  treatment_recovery: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700' },
  womens_house: { bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700' },
  mens_house: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700' },
};

const modelBadges = {
  per_bed: { label: 'PER BED', color: 'bg-indigo-100 text-indigo-700' },
  turnkey_house: { label: 'WHOLE HOUSE', color: 'bg-amber-100 text-amber-700' },
  mixed_flex: { label: 'FLEXIBLE', color: 'bg-cyan-100 text-cyan-700' },
};

export default function HouseCard({ property, onSelectBeds, onSelectHouse }) {
  const typeConfig = typeColors[property.property_type] || typeColors.transitional_housing;
  const modelConfig = modelBadges[property.housing_model] || modelBadges.per_bed;

  // Calculate occupancy for display
  const totalBeds = property.total_bed_count || 0;
  const occupiedBeds = property.occupied_beds || 0;
  const availableBeds = totalBeds - occupiedBeds;
  const occupancyPercent = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

  // Determine status
  const isFull = totalBeds > 0 && availableBeds === 0;
  const nearCapacity = totalBeds > 0 && occupancyPercent >= 80;
  const isEmpty = totalBeds === 0;

  return (
    <div
      onClick={() => onSelectHouse?.(property)}
      className={cn(
        'group relative rounded-lg border-2 transition-all duration-200 cursor-pointer',
        'hover:shadow-lg hover:-translate-y-0.5',
        typeConfig.bg,
        typeConfig.border,
        isFull && 'ring-2 ring-red-400 ring-offset-2',
        nearCapacity && !isFull && 'ring-2 ring-amber-400 ring-offset-2'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-inherit">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
              {property.property_name}
            </h3>
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span>{property.city}</span>
            </div>
          </div>
          {isFull && <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1">
          <span className={cn('text-xs font-semibold px-2 py-1 rounded', modelConfig.color)}>
            {modelConfig.label}
          </span>
          <span className={cn('text-xs font-medium px-2 py-1 rounded', typeConfig.badge)}>
            {property.property_type.replace(/_/g, ' ')}
          </span>
          {property.gender_restriction !== 'none' && (
            <span className="text-xs font-medium px-2 py-1 rounded bg-slate-100 text-slate-700">
              {property.gender_restriction.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Bed Inventory (Per-Bed Only) */}
        {property.housing_model === 'per_bed' && (
          <>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground">AVAILABLE BEDS</span>
                <span className={cn('text-2xl font-bold', availableBeds > 0 ? 'text-green-600' : 'text-red-600')}>
                  {availableBeds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all duration-300', occupancyPercent >= 80 ? 'bg-amber-500' : 'bg-green-500')}
                    style={{ width: `${occupancyPercent}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{Math.round(occupancyPercent)}%</span>
              </div>
            </div>

            {/* Bed Stats */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-inherit/50">
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">{totalBeds}</div>
                <div className="text-xs text-muted-foreground">Total Beds</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">{occupiedBeds}</div>
                <div className="text-xs text-muted-foreground">Occupied</div>
              </div>
            </div>
          </>
        )}

        {/* Turnkey Status */}
        {property.housing_model === 'turnkey_house' && (
          <div className="py-2 px-3 bg-amber-100/50 border border-amber-200 rounded-md">
            <div className="text-xs font-semibold text-amber-900 mb-1">FULL HOUSE LEASED</div>
            {property.turnkey_client_name && (
              <div className="text-xs text-amber-800">{property.turnkey_client_name}</div>
            )}
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="py-4 text-center">
            <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">Beds not configured</div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-2 pt-2 border-t border-inherit/50">
          <div className={cn('w-2 h-2 rounded-full', property.house_status === 'active' ? 'bg-green-500' : 'bg-slate-300')} />
          <span className="text-xs font-medium text-muted-foreground capitalize">{property.house_status}</span>
        </div>
      </div>

      {/* Footer Action (Per-Bed) */}
      {property.housing_model === 'per_bed' && (
        <div className="px-4 py-3 bg-foreground/5 border-t border-inherit rounded-b-[calc(0.5rem-2px)]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectBeds?.(property);
            }}
            className="w-full text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            View Beds →
          </button>
        </div>
      )}
    </div>
  );
}