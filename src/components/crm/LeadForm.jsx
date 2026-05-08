import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const SOURCES = ["website","referral","social_media","walk_in","phone_call","partner","other"];
const TIMELINES = ["immediate","within_30_days","1_3_months","3_6_months","exploring"];
const STAGES = ["new","contacted","qualified","showing_scheduled","application_submitted","approved","closed_won","closed_lost"];

export default function LeadForm({ lead, onSave, onCancel }) {
  const [form, setForm] = useState(lead || {
    first_name: "", last_name: "", email: "", phone: "",
    source: "website", stage: "new", lead_score: 0,
    property_interest: "", budget_min: "", budget_max: "",
    move_in_timeline: "exploring", notes: "",
  });
  const [saving, setSaving] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, lead_score: Number(form.lead_score) || 0, budget_min: Number(form.budget_min) || undefined, budget_max: Number(form.budget_max) || undefined };
    if (lead?.id) await base44.entities.Lead.update(lead.id, payload);
    else await base44.entities.Lead.create(payload);
    onSave();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-heading">{lead ? "Edit Lead" : "New Lead"}</h2>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">First Name *</label>
            <input value={form.first_name} onChange={e => set("first_name", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Last Name *</label>
            <input value={form.last_name} onChange={e => set("last_name", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Phone</label>
            <input value={form.phone} onChange={e => set("phone", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Lead Source</label>
            <select value={form.source} onChange={e => set("source", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {SOURCES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select></div>
          <div><label className="block text-xs text-muted-label mb-1">Stage</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {STAGES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Budget Min ($)</label>
            <input type="number" value={form.budget_min} onChange={e => set("budget_min", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Budget Max ($)</label>
            <input type="number" value={form.budget_max} onChange={e => set("budget_max", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Lead Score (0-100)</label>
            <input type="number" min="0" max="100" value={form.lead_score} onChange={e => set("lead_score", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-xs text-muted-label mb-1">Property Interest</label>
            <input value={form.property_interest} onChange={e => set("property_interest", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary" placeholder="Property name or type" /></div>
          <div><label className="block text-xs text-muted-label mb-1">Move-in Timeline</label>
            <select value={form.move_in_timeline} onChange={e => set("move_in_timeline", e.target.value)} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary">
              {TIMELINES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select></div>
        </div>
        <div><label className="block text-xs text-muted-label mb-1">Notes</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-sm text-heading focus:outline-none focus:border-primary resize-none" /></div>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.first_name || !form.last_name}>{saving ? "Saving..." : "Save Lead"}</Button>
        </div>
      </div>
    </div>
  );
}