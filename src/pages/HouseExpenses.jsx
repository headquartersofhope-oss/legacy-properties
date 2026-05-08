import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import AccessDenied from "@/components/AccessDenied";
import { Button } from "@/components/ui/button";
import { Plus, DollarSign, Building2, Calendar, CheckCircle, AlertCircle, Filter } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ExpenseForm from "@/components/expenses/ExpenseForm";

const CATEGORY_LABELS = {
  lease_rent: "Lease / Rent", mortgage: "Mortgage", utilities: "Utilities",
  maintenance: "Maintenance", cleaning: "Cleaning", landscaping: "Landscaping",
  furnishing: "Furnishing", supplies: "Supplies", staffing: "Staffing",
  insurance: "Insurance", property_tax: "Property Tax", other: "Other",
};

const PAID_COLORS = {
  unpaid: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  partial: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  paid: "bg-green-500/20 text-green-400 border border-green-500/30",
  overdue: "bg-red-500/20 text-red-400 border border-red-500/30",
};

export default function HouseExpenses() {
  const { user, isInternal } = useCurrentUser();
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paidFilter, setPaidFilter] = useState("all");

  useEffect(() => { if (isInternal) loadData(); else setLoading(false); }, [isInternal]);

  async function loadData() {
    setLoading(true);
    const [exp, props] = await Promise.all([
      base44.entities.HouseExpense.list("-expense_date"),
      base44.entities.Property.list(),
    ]);
    setExpenses(exp);
    setProperties(props);
    setLoading(false);
  }

  const filtered = expenses.filter(e => {
    const propMatch = propertyFilter === "all" || e.property_id === propertyFilter;
    const catMatch = categoryFilter === "all" || e.expense_category === categoryFilter;
    const paidMatch = paidFilter === "all" || e.paid_status === paidFilter;
    return propMatch && catMatch && paidMatch;
  });

  const stats = {
    total: filtered.reduce((s, e) => s + (e.amount || 0), 0),
    paid: filtered.filter(e => e.paid_status === "paid").reduce((s, e) => s + (e.amount || 0), 0),
    unpaid: filtered.filter(e => e.paid_status === "unpaid").reduce((s, e) => s + (e.amount || 0), 0),
    overdue: filtered.filter(e => e.paid_status === "overdue").reduce((s, e) => s + (e.amount || 0), 0),
  };

  async function markPaid(id) {
    await base44.entities.HouseExpense.update(id, { paid_status: "paid", payment_date: new Date().toISOString().split("T")[0] });
    loadData();
  }

  if (!isInternal) return <AccessDenied message="House expenses is restricted to internal staff." />;
  if (showForm || editExpense) return (
    <ExpenseForm
      expense={editExpense}
      properties={properties}
      onSave={() => { setShowForm(false); setEditExpense(null); loadData(); }}
      onCancel={() => { setShowForm(false); setEditExpense(null); }}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-heading">House Expenses</h1>
          <p className="text-muted-label text-sm mt-1">Track property operating costs</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Expense</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "slate" },
          { label: "Paid", value: stats.paid, color: "green" },
          { label: "Unpaid", value: stats.unpaid, color: "amber" },
          { label: "Overdue", value: stats.overdue, color: "red" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4">
            <p className={`text-xl font-bold text-${color}-400`}>${(value || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-label mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <select value={propertyFilter} onChange={e => setPropertyFilter(e.target.value)}
          className="bg-elevated border border-border rounded-lg px-3 py-1.5 text-xs text-heading focus:outline-none focus:border-primary">
          <option value="all">All Properties</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
        </select>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="bg-elevated border border-border rounded-lg px-3 py-1.5 text-xs text-heading focus:outline-none focus:border-primary">
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div className="flex gap-1">
          {["all","unpaid","partial","paid","overdue"].map(s => (
            <button key={s} onClick={() => setPaidFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${paidFilter === s ? "bg-primary text-white" : "bg-elevated text-muted-label hover:text-heading border border-border"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-label">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No expenses found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(exp => (
            <div key={exp.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-heading text-sm">{exp.vendor_payee || "Unnamed Expense"}</p>
                    <span className="text-[10px] bg-elevated border border-border px-2 py-0.5 rounded-full text-muted-label capitalize">
                      {CATEGORY_LABELS[exp.expense_category] || exp.expense_category}
                    </span>
                    {exp.is_recurring && <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">Recurring</span>}
                  </div>
                  <div className="flex gap-4 mt-1 text-[11px] text-muted-label flex-wrap">
                    {exp.property_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{exp.property_name}</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{exp.expense_date}</span>
                    {exp.due_date && <span>Due: {exp.due_date}</span>}
                  </div>
                  {exp.description && <p className="text-xs text-muted-label mt-1 truncate">{exp.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-lg font-bold text-heading">${(exp.amount || 0).toLocaleString()}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${PAID_COLORS[exp.paid_status] || "bg-slate-500/20 text-slate-400"}`}>
                    {exp.paid_status?.replace(/_/g, " ")}
                  </span>
                  <div className="flex gap-1">
                    {exp.paid_status !== "paid" && (
                      <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-green-400 border-green-500/30" onClick={() => markPaid(exp.id)}>
                        <CheckCircle className="w-3 h-3 mr-1" />Mark Paid
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEditExpense(exp)}>Edit</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}