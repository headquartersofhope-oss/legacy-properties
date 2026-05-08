import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import AccessDenied from "@/components/AccessDenied";
import { TrendingUp, TrendingDown, DollarSign, Building2, AlertCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";

function fmt(n) { return `$${(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; }

export default function PLDashboard() {
  const { user, isInternal } = useCurrentUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("ytd"); // ytd | 3m | 6m | 12m

  useEffect(() => { if (isInternal) loadData(); else setLoading(false); }, [isInternal]);

  async function loadData() {
    setLoading(true);
    const [invoices, payments, expenses, properties] = await Promise.all([
      base44.entities.Invoice.list(),
      base44.entities.Payment.list(),
      base44.entities.HouseExpense.list(),
      base44.entities.Property.list(),
    ]);

    // Build monthly P&L
    const monthlyMap = {};

    payments.forEach(p => {
      if (!p.payment_date) return;
      const month = p.payment_date.substring(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, expenses: 0 };
      monthlyMap[month].revenue += (p.payment_amount || 0);
    });

    expenses.forEach(e => {
      if (!e.expense_date) return;
      const month = e.expense_date.substring(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { month, revenue: 0, expenses: 0 };
      monthlyMap[month].expenses += (e.amount || 0);
    });

    const monthly = Object.values(monthlyMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(m => ({ ...m, profit: m.revenue - m.expenses, label: new Date(m.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }) }));

    // Filter by period
    const now = new Date();
    const monthsBack = period === "3m" ? 3 : period === "6m" ? 6 : period === "12m" ? 12 : 12;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).toISOString().substring(0, 7);
    const periodData = period === "ytd"
      ? monthly.filter(m => m.month.startsWith(now.getFullYear().toString()))
      : monthly.filter(m => m.month >= cutoff);

    // Totals
    const totalRevenue = payments.reduce((s, p) => s + (p.payment_amount || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Paid invoices
    const paidInvoices = invoices.filter(i => i.status === "paid");
    const pendingRevenue = invoices.filter(i => ["sent","overdue"].includes(i.status)).reduce((s, i) => s + (i.total_amount || 0), 0);

    // By property
    const byProperty = {};
    expenses.forEach(e => {
      if (!e.property_name) return;
      if (!byProperty[e.property_name]) byProperty[e.property_name] = { name: e.property_name, expenses: 0, revenue: 0 };
      byProperty[e.property_name].expenses += (e.amount || 0);
    });
    payments.forEach(p => {
      if (!p.property_name) return;
      if (!byProperty[p.property_name]) byProperty[p.property_name] = { name: p.property_name, expenses: 0, revenue: 0 };
      byProperty[p.property_name].revenue += (p.payment_amount || 0);
    });
    const propertyPL = Object.values(byProperty).map(p => ({ ...p, profit: p.revenue - p.expenses }));

    // Expense categories
    const byCat = {};
    expenses.forEach(e => {
      const cat = e.expense_category || "other";
      byCat[cat] = (byCat[cat] || 0) + (e.amount || 0);
    });
    const expenseCats = Object.entries(byCat).map(([name, value]) => ({ name: name.replace(/_/g, " "), value })).sort((a, b) => b.value - a.value);

    setData({ monthly, periodData, totalRevenue, totalExpenses, netProfit, pendingRevenue, propertyPL, expenseCats, invoices, payments, expenses });
    setLoading(false);
  }

  if (!isInternal) return <AccessDenied message="P&L Dashboard is restricted to internal staff." />;
  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const margin = data.totalRevenue > 0 ? ((data.netProfit / data.totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-heading">P&L Dashboard</h1>
          <p className="text-muted-label text-sm mt-1">Revenue, expenses & profitability</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border overflow-hidden bg-elevated">
          {["ytd","3m","6m","12m"].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium uppercase transition-all ${period === p ? "bg-primary text-white" : "text-muted-label hover:text-heading"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Revenue" value={fmt(data.totalRevenue)} trend={null} color="green" icon={TrendingUp} />
        <KPICard label="Total Expenses" value={fmt(data.totalExpenses)} trend={null} color="red" icon={TrendingDown} />
        <KPICard label="Net Profit" value={fmt(data.netProfit)} positive={data.netProfit >= 0} color={data.netProfit >= 0 ? "emerald" : "red"} icon={DollarSign} sub={`${margin}% margin`} />
        <KPICard label="Pending Revenue" value={fmt(data.pendingRevenue)} color="amber" icon={AlertCircle} sub="outstanding invoices" />
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="bg-card border border-border rounded-lg p-5 mb-6">
        <h3 className="text-sm font-semibold text-heading mb-4">Revenue vs Expenses ({period.toUpperCase()})</h3>
        {data.periodData.length === 0 ? (
          <p className="text-muted-label text-sm text-center py-8">No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.periodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-label))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-label))" }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, ""]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="hsl(162,45%,52%)" radius={[4,4,0,0]} />
              <Bar dataKey="expenses" name="Expenses" fill="hsl(0,80%,60%)" radius={[4,4,0,0]} />
              <Bar dataKey="profit" name="Net Profit" fill="hsl(217,91%,60%)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Property P&L */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-heading mb-4">P&L by Property</h3>
          {data.propertyPL.length === 0 ? (
            <p className="text-muted-label text-sm text-center py-6">No property data yet</p>
          ) : (
            <div className="space-y-3">
              {data.propertyPL.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center flex-shrink-0"><Building2 className="w-4 h-4 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-heading truncate">{p.name}</p>
                    <div className="flex gap-3 text-[10px] text-muted-label">
                      <span>Rev: {fmt(p.revenue)}</span>
                      <span>Exp: {fmt(p.expenses)}</span>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${p.profit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(p.profit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-heading mb-4">Expense Breakdown</h3>
          {data.expenseCats.length === 0 ? (
            <p className="text-muted-label text-sm text-center py-6">No expense data yet</p>
          ) : (
            <div className="space-y-2">
              {data.expenseCats.slice(0, 8).map(cat => {
                const pct = data.totalExpenses > 0 ? ((cat.value / data.totalExpenses) * 100).toFixed(0) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-body-text capitalize">{cat.name}</span>
                      <span className="text-heading font-medium">{fmt(cat.value)} <span className="text-muted-label">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, color, icon: Icon, sub }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${color}-400`} />
        </div>
        <span className="text-xs text-muted-label">{label}</span>
      </div>
      <p className="text-xl font-bold text-heading">{value}</p>
      {sub && <p className="text-[10px] text-muted-label mt-0.5">{sub}</p>}
    </div>
  );
}