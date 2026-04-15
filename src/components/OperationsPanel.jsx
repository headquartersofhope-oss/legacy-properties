import { AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function OperationsPanel({ 
  fullHouses = 0,
  nearCapacity = 0,
  pendingReferrals = 0,
  diagnosticWarnings = 0,
  loading = false
}) {
  const alerts = [
    {
      label: 'HOUSES AT CAPACITY',
      value: fullHouses,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      critical: fullHouses > 0
    },
    {
      label: 'NEAR CAPACITY',
      value: nearCapacity,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      critical: nearCapacity > 0
    },
    {
      label: 'PENDING REFERRALS',
      value: pendingReferrals,
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      critical: false
    },
    {
      label: 'DIAGNOSTICS WARNINGS',
      value: diagnosticWarnings,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      critical: diagnosticWarnings > 0
    }
  ];

  return (
    <div className="bg-card rounded-lg border-2 border-border p-6">
      <h2 className="text-lg font-bold text-foreground mb-4">LIVE OPERATIONS</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {alerts.map((alert, idx) => {
          const Icon = alert.icon;
          return (
            <div
              key={idx}
              className={cn(
                'rounded-lg border-2 p-4 transition-all duration-200',
                alert.bg,
                alert.critical && 'border-current ring-2 ring-offset-2 shadow-md'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold tracking-wider opacity-70">
                  {alert.label}
                </span>
                <Icon className={cn('w-4 h-4', alert.color)} />
              </div>
              <div className={cn('text-2xl font-bold', alert.color, loading && 'opacity-50')}>
                {loading ? '—' : alert.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}