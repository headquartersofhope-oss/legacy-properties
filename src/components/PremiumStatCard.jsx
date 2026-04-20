import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PremiumStatCard({ title, value, trend, accentColor = 'primary', icon: Icon }) {
  const accentMap = {
    primary: 'border-primary from-primary/8',
    rose: 'border-accent-rose from-accent-rose/8',
    emerald: 'border-accent-emerald from-accent-emerald/8',
    amber: 'border-accent-amber from-accent-amber/8',
    blue: 'border-accent-blue from-accent-blue/8',
    indigo: 'border-indigo-500 from-indigo-500/8',
  };

  const accentClass = accentMap[accentColor] || accentMap.primary;

  return (
    <div className={`border-t-2 ${accentClass} bg-gradient-to-br to-card rounded-lg p-6 hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-label text-sm font-medium mb-2">{title}</p>
          <p className="text-5xl font-bold text-white mb-3">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs ${trend >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {trend >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend)}% from last period</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg bg-${accentColor}/10`}>
            <Icon className="w-6 h-6 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}