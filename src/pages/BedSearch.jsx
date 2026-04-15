import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import FormField from "@/components/FormField";
import { Search, MapPin, Users, Home } from "lucide-react";

export default function BedSearch() {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    gender: '',
    type: '',
    amenity: ''
  });

  useEffect(() => { load(); }, []);

  async function load() {
    const props = await base44.entities.Property.filter({
      house_status: 'active',
      visible_to_partners: true
    });
    setProperties(props);
    filterProperties(props, filters);
    setLoading(false);
  }

  function filterProperties(props, f) {
    let filtered = props;
    if (f.city) filtered = filtered.filter(p => p.city?.toLowerCase().includes(f.city.toLowerCase()));
    if (f.gender && f.gender !== 'all') filtered = filtered.filter(p => p.gender_restriction === f.gender || p.gender_restriction === 'none');
    if (f.type && f.type !== 'all') filtered = filtered.filter(p => p.property_type === f.type);
    setFilteredProperties(filtered);
  }

  function handleFilterChange(name, value) {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    filterProperties(properties, newFilters);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'transitional_housing', label: 'Transitional Housing' },
    { value: 'sober_living', label: 'Sober Living' },
    { value: 'veteran_house', label: 'Veteran House' },
    { value: 'justice_reentry', label: 'Justice/Reentry' },
    { value: 'treatment_recovery', label: 'Treatment/Recovery' },
  ];

  const genderOptions = [
    { value: 'all', label: 'All Genders' },
    { value: 'none', label: 'Mixed' },
    { value: 'male_only', label: 'Male' },
    { value: 'female_only', label: 'Female' },
  ];

  return (
    <div>
      <PageHeader title="Find a Bed" subtitle="Search available housing opportunities" />

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="City" name="city" value={filters.city} onChange={(_,v) => handleFilterChange('city', v)} placeholder="Search by city" />
          <FormField label="Gender" name="gender" value={filters.gender} onChange={(_,v) => handleFilterChange('gender', v)} type="select" options={genderOptions} />
          <FormField label="House Type" name="type" value={filters.type} onChange={(_,v) => handleFilterChange('type', v)} type="select" options={typeOptions} />
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProperties.map(prop => {
          const availableBeds = prop.total_bed_count || 0; // Would be calculated from Bed records in production
          return (
            <div key={prop.id} className="bg-card border border-border rounded-lg p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Home className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{prop.property_name}</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {prop.city}, {prop.state}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Available Beds:</span>
                  <span className="font-semibold text-foreground">{availableBeds}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={prop.property_type} />
                  {prop.gender_restriction !== 'none' && <StatusBadge status={prop.gender_restriction} />}
                </div>
              </div>

              <div className="flex gap-1 flex-wrap mb-3 text-xs">
                {prop.internet_wifi && <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded text-[10px]">Wi-Fi</span>}
                {prop.washer_dryer && <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded text-[10px]">Laundry</span>}
                {prop.parking && <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded text-[10px]">Parking</span>}
                {prop.gym_area && <span className="px-2 py-1 bg-secondary/50 text-secondary-foreground rounded text-[10px]">Gym</span>}
              </div>

              {prop.demographic_focus && (
                <p className="text-xs text-muted-foreground mb-3">Focus: <span className="font-medium">{prop.demographic_focus}</span></p>
              )}

              <button className="w-full px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Request Application
              </button>
            </div>
          );
        })}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No available beds match your search criteria.</p>
        </div>
      )}
    </div>
  );
}