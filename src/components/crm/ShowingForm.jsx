import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function ShowingForm({ showing, onSave, onCancel }) {
  const [form, setForm] = useState(showing || {
    lead_name: "", lead_email: "", property_name: "",
    showing_date: new Date().toISOString().split("T")[0],
    showing_time: "10:00 AM", duration_minutes: 30,
    status: "scheduled", assigned_staff_name: "", assigned_staff_email: "", notes: "",
  });
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([base44.entities.Lead.list(), base44.entities.Property.list()])
      .then(([l, p]) => { setLeads(l); setProperties(p); });
  }, []);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function selectLead(leadId) {
    const lead = leads.find(l => l.id === leadId);
    if (lead) { set("lead_id", lead.id); set("lead_name", `${lead.first_name} ${lead.last_name}`); set("lead_email", lead.email || ""); }
  }

  function selectProperty(propId) {
    const prop = properties.find(p => p.id === propId);
    if (prop) { set("property_id", prop.id); set("property_name", prop.property_name); }
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, duration_minutes: Number(form.duration_minutes) || 30 };
    if (showing?.id) await base44.entities.Showing.update(showing.id, payload);
    else await base44.entities.Showing.create(payload);
    onSave();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heading">{showing ? "Edit Showing" : "Schedule Showing"}</h2>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Lead *</label>
            <select onChange={e => selectLead(e.target.value)} defaultValue=""
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              <option value="" disabled>Select lead…</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.first_name} {l.last_name}</option>)}
            </select>
            <input value={form.lead_name} onChange={e => set("lead_name", e.target.value)} placeholder="Or type name" className="mt-1 w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" />
          </div>
          <div><label className="block text-xs text-muted-label mb-1">Property *</label>
            <select onChange={e => selectProperty(e.target.value)} defaultValue=""
              className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              <option value="" disabled>Select property…</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.property_name}</option>)}
            </select>
            <input value={form.property_name} onChange={e => set("property_name", e.target.value)} placeholder="Or type name" className="mt-1 w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Date *</label>
            <input type="date" value={form.showing_date} onChange={e => set("showing_date", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Time</label>
            <input value={form.showing_time} onChange={e => set("showing_time", e.target.value)} placeholder="e.g. 2:00 PM" className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Duration (min)</label>
            <input type="number" value={form.duration_minutes} onChange={e => set("duration_minutes", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Assigned Staff</label>
            <input value={form.assigned_staff_name} onChange={e => set("assigned_staff_name", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {["scheduled","confirmed","completed","cancelled","no_show"].map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
            </select></div>
        </div>
        <div><label className="block text-xs text-muted-label mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary resize-none" /></div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.lead_name || !form.property_name || !form.showing_date}>{saving ? "Saving..." : "Save Showing"}</Button>
        </div>
      </div>
    </div>
  );
}