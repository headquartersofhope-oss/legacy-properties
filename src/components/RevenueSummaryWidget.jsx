import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';

function fmt(n) { return `$${(n || 0).toLocaleString()}`; }

export default function RevenueSummaryWidget() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Invoice.list('-created_date', 500).then(data => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

  const paidThisMonth = invoices.filter(i => i.status === 'paid' && i.paid_date >= startOfMonth)
    .reduce((s, i) => s + (i.total_amount || 0), 0);

  const occupancyRevenue = invoices.filter(i => i.status === 'paid' && i.invoice_type === 'resident_fee' && i.paid_date >= startOfMonth)
    .reduce((s, i) => s + (i.total_amount || 0), 0);

  const outstanding = invoices.filter(i => ['sent','draft','overdue'].includes(i.status))
    .reduce((s, i) => s + (i.total_amount || 0), 0);

  // Build last 6 months bar chart data
  const monthData = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const monthStart = d.toISOString().split('T')[0];
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const label = d.toLocaleString('default', { month: 'short' });
    const revenue = invoices.filter(i => i.status === 'paid' && i.paid_date >= monthStart && i.paid_date <= monthEnd)
      .reduce((s, i) => s + (i.total_amount || 0), 0);
    monthData.push({ month: label, revenue });
  }

  if (loading) return (
    <div className="bg-card border border-card-border rounded-lg p-5 animate-pulse h-64" />
  );

  return (
    <div className="bg-card border border-card-border rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-heading text-sm">Revenue Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-elevated rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-label uppercase tracking-wide mb-1">Monthly Revenue</p>
          <p className="text-lg font-bold text-primary">{fmt(paidThisMonth)}</p>
        </div>
        <div className="bg-elevated rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-label uppercase tracking-wide mb-1">Occupancy Revenue</p>
          <p className="text-lg font-bold text-accent-emerald">{fmt(occupancyRevenue)}</p>
        </div>
        <div className="bg-elevated rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-label uppercase tracking-wide mb-1">Outstanding</p>
          <p className="text-lg font-bold text-accent-amber">{fmt(outstanding)}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-label uppercase tracking-wide mb-2">Revenue — Last 6 Months</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={monthData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(210 10% 19%)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'hsl(210 10% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(210 12% 9%)', border: '1px solid hsl(210 10% 19%)', borderRadius: 6, fontSize: 12, color: 'hsl(210 20% 90%)' }}
              formatter={(v) => [fmt(v), 'Revenue']}
            />
            <Bar dataKey="revenue" fill="hsl(162 45% 52%)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}