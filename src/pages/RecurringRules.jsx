import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/StatusBadge';

const CYCLES = ['weekly','monthly','quarterly'];
const BILLING_TYPES = ['resident_weekly','resident_monthly','partner_monthly','license_monthly'];
const BILLING_TYPE_LABELS = { resident_weekly:'Resident Weekly', resident_monthly:'Resident Monthly', partner_monthly:'Partner Monthly', license_monthly:'License Monthly' };

function fmt(n) { return `$${(n||0).toLocaleString()}`; }

export default function RecurringRules() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rule_name:'', billing_type:'resident_monthly', entity_id:'', amount:'', billing_cycle:'monthly', next_billing_date:'', active:true, auto_send:false });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadRules(); }, []);

  async function loadRules() {
    setLoading(true);
    const data = await base44.entities.RecurringBillingRule.list('-created_date', 100);
    setRules(data);
    setLoading(false);
  }

  async function toggleActive(rule) {
    await base44.entities.RecurringBillingRule.update(rule.id, { active: !rule.active });
    loadRules();
  }

  async function saveRule() {
    setSaving(true);
    await base44.entities.RecurringBillingRule.create({ ...form, amount: parseFloat(form.amount) || 0 });
    setSaving(false);
    setShowForm(false);
    setForm({ rule_name:'', billing_type:'resident_monthly', entity_id:'', amount:'', billing_cycle:'monthly', next_billing_date:'', active:true, auto_send:false });
    loadRules();
  }

  async function runNow() {
    await base44.functions.invoke('processRecurringBilling', {});
    loadRules();
  }

  const labelClass = "block text-xs font-semibold text-muted-label mb-1 uppercase tracking-wide";
  const inputClass = "w-full bg-input border border-card-border rounded px-3 py-2 text-sm text-heading placeholder-muted-label focus:outline-none focus:border-primary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-heading">Recurring Billing Rules</h1>
          <p className="text-sm text-muted-label mt-1">Automated billing schedules for residents and partners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runNow} className="gap-2"><RefreshCw className="w-4 h-4" />Run Now</Button>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" />Add Rule</Button>
        </div>
      </div>

      {/* Add Rule Form */}
      {showForm && (
        <div className="bg-card border border-card-border rounded-lg p-6 space-y-4">
          <h2 className="font-semibold text-heading">New Billing Rule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Rule Name *</label>
              <input className={inputClass} value={form.rule_name} onChange={e => setForm(f=>({...f,rule_name:e.target.value}))} placeholder="e.g. John Doe Monthly Fee" />
            </div>
            <div>
              <label className={labelClass}>Billing Type</label>
              <select className={inputClass} value={form.billing_type} onChange={e => setForm(f=>({...f,billing_type:e.target.value}))}>
                {BILLING_TYPES.map(t => <option key={t} value={t}>{BILLING_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Amount ($)</label>
              <input className={inputClass} type="number" min="0" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} placeholder="0" />
            </div>
            <div>
              <label className={labelClass}>Billing Cycle</label>
              <select className={inputClass} value={form.billing_cycle} onChange={e => setForm(f=>({...f,billing_cycle:e.target.value}))}>
                {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Next Billing Date</label>
              <input className={inputClass} type="date" value={form.next_billing_date} onChange={e => setForm(f=>({...f,next_billing_date:e.target.value}))} />
            </div>
            <div>
              <label className={labelClass}>Entity ID (optional)</label>
              <input className={inputClass} value={form.entity_id} onChange={e => setForm(f=>({...f,entity_id:e.target.value}))} placeholder="Resident or partner ID" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-body-text cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(f=>({...f,active:e.target.checked}))} className="rounded" />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm text-body-text cursor-pointer">
              <input type="checkbox" checked={form.auto_send} onChange={e => setForm(f=>({...f,auto_send:e.target.checked}))} className="rounded" />
              Auto-Send Invoice
            </label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveRule} disabled={saving || !form.rule_name || !form.amount}>Save Rule</Button>
          </div>
        </div>
      )}

      {/* Rules Grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-label">Loading...</div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 text-muted-label">No billing rules yet. Add your first rule.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-card border rounded-lg p-5 space-y-3 transition-all ${rule.active ? 'border-card-border' : 'border-card-border opacity-60'}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-heading">{rule.rule_name}</h3>
                  <p className="text-xs text-muted-label mt-0.5">{BILLING_TYPE_LABELS[rule.billing_type] || rule.billing_type}</p>
                </div>
                <button
                  onClick={() => toggleActive(rule)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${rule.active ? 'bg-primary' : 'bg-card-border'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rule.active ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="text-2xl font-bold text-primary">{fmt(rule.amount)}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-label">
                <div>
                  <span className="block font-semibold text-body-text uppercase tracking-wide text-[10px] mb-0.5">Cycle</span>
                  <span className="capitalize">{rule.billing_cycle}</span>
                </div>
                <div>
                  <span className="block font-semibold text-body-text uppercase tracking-wide text-[10px] mb-0.5">Next Bill</span>
                  <span>{rule.next_billing_date || '—'}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1 border-t border-card-border">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${rule.active ? 'bg-accent-emerald/20 text-accent-emerald' : 'bg-accent-slate/20 text-accent-slate'}`}>
                  {rule.active ? 'Active' : 'Paused'}
                </span>
                {rule.auto_send && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-accent-blue/20 text-accent-blue">Auto-Send</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}