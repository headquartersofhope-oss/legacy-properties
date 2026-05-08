import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  "lease_rent","mortgage","utilities","maintenance","cleaning",
  "landscaping","furnishing","supplies","staffing","insurance","property_tax","other"
];

export default function ExpenseForm({ expense, properties, onSave, onCancel }) {
  const [form, setForm] = useState(expense || {
    property_id: "", property_name: "", expense_category: "utilities",
    vendor_payee: "", expense_date: new Date().toISOString().split("T")[0],
    due_date: "", amount: "", description: "", is_recurring: false,
    recurring_frequency: "monthly", paid_status: "unpaid", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function selectProperty(propId) {
    const prop = properties.find(p => p.id === propId);
    if (prop) { set("property_id", prop.id); set("property_name", prop.property_name); }
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, amount: Number(form.amount) || 0 };
    if (expense?.id) await base44.entities.HouseExpense.update(expense.id, payload);
    else await base44.entities.HouseExpense.create(payload);
    onSave();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heading">{expense ? "Edit Expense" : "Add Expense"}</h2>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Property *</label>
            <select value={form.property_id} onChange={e => selectProperty(e.target.value)}
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              <option value="">Select property…</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
            </select></div>
          <div><label className="block text-xs text-muted-label mb-1">Category *</label>
            <select value={form.expense_category} onChange={e => set("expense_category", e.target.value)}
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Vendor / Payee</label>
            <input value={form.vendor_payee} onChange={e => set("vendor_payee", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Amount ($) *</label>
            <input type="number" value={form.amount} onChange={e => set("amount", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Expense Date *</label>
            <input type="date" value={form.expense_date} onChange={e => set("expense_date", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Paid Status</label>
            <select value={form.paid_status} onChange={e => set("paid_status", e.target.value)}
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {["unpaid","partial","paid","overdue"].map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.is_recurring} onChange={e => set("is_recurring", e.target.checked)} className="rounded" />
              <span className="text-sm text-body-text">Recurring expense</span>
            </label>
            {form.is_recurring && (
              <select value={form.recurring_frequency} onChange={e => set("recurring_frequency", e.target.value)}
                className="mt-2 w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
                {["monthly","quarterly","annual","custom"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            )}
          </div>
        </div>
        <div><label className="block text-xs text-muted-label mb-1">Description</label>
          <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary resize-none" /></div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.amount || !form.expense_date}>{saving ? "Saving..." : "Save Expense"}</Button>
        </div>
      </div>
    </div>
  );
}