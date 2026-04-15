import { TrendingUp, Home, Users, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KPIStrip({ 
  totalHouses = 0,
  totalBeds = 0,
  availableBeds = 0,
  occupancyPercent = 0,
  loading = false
}) {
  const kpis = [
    {
      label: 'HOUSES',
      value: totalHouses,
      icon: Home,
      color: 'bg-blue-50 text-blue-700'
    },
    {
      label: 'TOTAL BEDS',
      value: totalBeds,
      icon: Users,
      color: 'bg-slate-50 text-slate-700'
    },
    {
      label: 'AVAILABLE',
      value: availableBeds,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-700',
      highlight: true
    },
    {
      label: 'OCCUPANCY',
      value: `${Math.round(occupancyPercent)}%`,
      icon: BarChart3,
      color: 'bg-indigo-50 text-indigo-700'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className={cn(
              'rounded-lg border-2 p-4 transition-all duration-200',
              kpi.color,
              kpi.highlight && 'ring-2 ring-offset-2 ring-green-400 shadow-lg'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-bold tracking-wider opacity-70">
                {kpi.label}
              </span>
              <Icon className="w-4 h-4 opacity-50" />
            </div>
            <div className={cn('text-3xl font-bold', loading && 'opacity-50')}>
              {loading ? '—' : kpi.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}