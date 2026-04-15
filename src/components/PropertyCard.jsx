import { MapPin, Users, Home, Tag, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { Progress } from "@/components/ui/progress";

const typeColors = {
  transitional_housing: "bg-blue-100 text-blue-700",
  sober_living: "bg-emerald-100 text-emerald-700",
  veteran_house: "bg-purple-100 text-purple-700",
  justice_reentry: "bg-orange-100 text-orange-700",
  treatment_recovery: "bg-rose-100 text-rose-700",
  womens_house: "bg-pink-100 text-pink-700",
  mens_house: "bg-slate-100 text-slate-700",
};

const modelColors = {
  per_bed: "bg-sky-100 text-sky-700",
  turnkey_house: "bg-amber-100 text-amber-700",
  mixed_flex: "bg-purple-100 text-purple-700",
};

export default function PropertyCard({ property, onClick }) {
  const occupancyPercent = property.total_bed_count ? Math.round((property.occupied || 0) / property.total_bed_count * 100) : 0;
  const availableBeds = (property.total_bed_count || 0) - (property.occupied || 0);

  return (
    <div 
      onClick={onClick}
      className="bg-card border-2 border-border rounded-lg p-4 shadow-sm hover:shadow-lg hover:border-primary/50 transition-all cursor-pointer duration-200 group"
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{property.property_name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              {property.city}, {property.state}
            </div>
          </div>
          <StatusBadge status={property.house_status} />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${modelColors[property.housing_model] || modelColors.per_bed}`}>
            {property.housing_model === 'per_bed' ? 'Per-Bed' : 'Turnkey'}
          </span>
          {property.property_type && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColors[property.property_type] || 'bg-gray-100 text-gray-700'}`}>
              {property.property_type.replace(/_/g, ' ')}
            </span>
          )}
          {property.gender_restriction && property.gender_restriction !== 'none' && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              {property.gender_restriction === 'male_only' ? '♂ Male' : property.gender_restriction === 'female_only' ? '♀ Female' : 'Mixed'}
            </span>
          )}
        </div>

        {/* Occupancy */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">{occupancyPercent}% Occupied</span>
            </div>
            <span className="text-xs text-muted-foreground">{availableBeds} available</span>
          </div>
          <Progress value={occupancyPercent} className="h-2" />
          <div className="text-[10px] text-muted-foreground">
            {property.occupied || 0} of {property.total_bed_count || 0} beds
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Home className="w-3.5 h-3.5" />
            {property.room_count || 0} rooms
          </div>
          {occupancyPercent >= 90 && (
            <div className="flex items-center gap-1 text-amber-600">
              <AlertCircle className="w-3.5 h-3.5" />
              Near capacity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}