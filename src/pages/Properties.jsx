import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import PropertyCard from '@/components/PropertyCard';
import FilterBar from '@/components/FilterBar';
import EmptyState from '@/components/EmptyState';
import { Plus, Home, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Properties() {
  const navigate = useNavigate();
  const { user, isInternal, isManager } = useCurrentUser();
  const [properties, setProperties] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card');
  const [filters, setFilters] = useState({
    housing_model: null,
    property_type: null,
    city: null,
    gender_restriction: null,
    house_status: null,
    occupancy_level: null,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [propsRes, occRes] = await Promise.all([
          base44.entities.Property.list(),
          base44.entities.OccupancyRecord.list(),
        ]);
        setProperties(propsRes || []);
        setOccupancy(occRes || []);

        // Load navigation filters from session
        const navFilters = sessionStorage.getItem('navigationFilters');
        if (navFilters) {
          setFilters(prev => ({ ...prev, ...JSON.parse(navFilters) }));
          sessionStorage.removeItem('navigationFilters');
        }
      } catch (error) {
        console.error('Properties load error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  // Apply filters
  const filteredProperties = properties.filter((prop) => {
    if (filters.housing_model && prop.housing_model !== filters.housing_model) return false;
    if (filters.property_type && prop.property_type !== filters.property_type) return false;
    if (filters.city && prop.city !== filters.city) return false;
    if (filters.gender_restriction && prop.gender_restriction !== filters.gender_restriction) return false;
    if (filters.house_status && prop.house_status !== filters.house_status) return false;
    
    if (filters.occupancy_level) {
      const occupied = occupancy.filter((o) => o.property_id === prop.id && o.occupancy_status === 'active').length;
      const total = prop.total_bed_count || 0;
      const level = total > 0 ? (occupied / total) : 0;
      
      if (filters.occupancy_level === 'full' && level < 1) return false;
      if (filters.occupancy_level === 'near' && (level < 0.8 || level >= 1)) return false;
    }
    
    return true;
  });

  // Get unique values for filters
  const cities = [...new Set(properties.map(p => p.city).filter(Boolean))];
  const propertyTypes = [...new Set(properties.map(p => p.property_type).filter(Boolean))];

  const filterOptions = [
    {
      key: 'housing_model',
      label: 'Model',
      values: [
        { value: 'per_bed', label: 'Per-Bed' },
        { value: 'turnkey_house', label: 'Turnkey' },
      ],
    },
    {
      key: 'property_type',
      label: 'Type',
      values: propertyTypes.map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').toUpperCase(),
      })),
    },
    {
      key: 'city',
      label: 'City',
      values: cities.map(c => ({ value: c, label: c })),
    },
    {
      key: 'gender_restriction',
      label: 'Gender',
      values: [
        { value: 'male_only', label: 'Male Only' },
        { value: 'female_only', label: 'Female Only' },
        { value: 'mixed', label: 'Mixed' },
      ],
    },
    {
      key: 'house_status',
      label: 'Status',
      values: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'under_maintenance', label: 'Under Maintenance' },
      ],
    },
  ];

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      housing_model: null,
      property_type: null,
      city: null,
      gender_restriction: null,
      house_status: null,
      occupancy_level: null,
    });
  };

  const enrichedProperties = filteredProperties.map(prop => ({
    ...prop,
    occupied: occupancy.filter((o) => o.property_id === prop.id && o.occupancy_status === 'active').length,
  }));

  const hasActiveFilters = Object.values(filters).some(v => v !== null && v !== undefined && v !== '');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Properties"
        subtitle={`${filteredProperties.length} of ${properties.length} properties`}
      >
        {(isInternal || isManager) && (
          <Button 
            onClick={() => navigate('/property-create')}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> New Property
          </Button>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="bg-card border-2 border-border rounded-lg p-4">
        <FilterBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearFilters}
          filterOptions={filterOptions}
        />
      </div>

      {/* View Toggle */}
      <div className="flex justify-end">
        <Tabs value={viewMode} onValueChange={setViewMode}>
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="card" className="gap-1">
              <LayoutGrid className="w-4 h-4" /> Card
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-1">
              <LayoutList className="w-4 h-4" /> Table
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : enrichedProperties.length === 0 ? (
        <EmptyState
          icon={Home}
          title={hasActiveFilters ? "No properties match your filters" : "No properties configured"}
          description={hasActiveFilters ? "Try adjusting your filters or clearing them to see all properties." : "Start by creating your first property."}
          actionLabel={hasActiveFilters ? "Clear filters" : "Create Property"}
          onAction={hasActiveFilters ? handleClearFilters : () => navigate('/property-create')}
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrichedProperties.map(prop => (
            <PropertyCard 
              key={prop.id} 
              property={prop}
              onClick={() => navigate(`/property/${prop.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-card border-2 border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b-2 border-border">
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Model</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Beds</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Occupancy</th>
                  <th className="px-4 py-3 text-left font-bold text-foreground/70 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {enrichedProperties.map(prop => (
                  <tr 
                    key={prop.id}
                    className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => navigate(`/property/${prop.id}`)}
                  >
                    <td className="px-4 py-3 font-medium">{prop.property_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{prop.city}, {prop.state}</td>
                    <td className="px-4 py-3 text-sm">{prop.housing_model === 'per_bed' ? 'Per-Bed' : 'Turnkey'}</td>
                    <td className="px-4 py-3">{prop.total_bed_count || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      {prop.occupied || 0} / {prop.total_bed_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${prop.house_status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {prop.house_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}