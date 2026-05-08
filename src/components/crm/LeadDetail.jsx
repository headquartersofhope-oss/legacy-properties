import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, Phone, Calendar, Star, Edit, Trash2 } from "lucide-react";
import LeadForm from "./LeadForm";

const STAGES = ["new","contacted","qualified","showing_scheduled","application_submitted","approved","closed_won","closed_lost"];
const STAGE_COLORS = {
  new: "bg-slate-500", contacted: "bg-blue-500", qualified: "bg-indigo-500",
  showing_scheduled: "bg-violet-500", application_submitted: "bg-amber-500",
  approved: "bg-green-500", closed_won: "bg-emerald-600", closed_lost: "bg-red-500",
};

export default function LeadDetail({ lead: initialLead, onBack, isInternal }) {
  const [lead, setLead] = useState(initialLead);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function updateStage(stage) {
    setSaving(true);
    const updated = await base44.entities.Lead.update(lead.id, { stage });
    setLead(l => ({ ...l, stage }));
    setSaving(false);
  }

  async function deleteLead() {
    if (!confirm("Delete this lead?")) return;
    await base44.entities.Lead.delete(lead.id);
    onBack();
  }

  if (editing) return <LeadForm lead={lead} onSave={() => { setEditing(false); onBack(); }} onCancel={() => setEditing(false)} />;

  const stageIdx = STAGES.indexOf(lead.stage);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-heading">{lead.first_name} {lead.last_name}</h2>
          <p className="text-xs text-muted-label capitalize">{lead.source?.replace(/_/g, " ")} · {lead.move_in_timeline?.replace(/_/g, " ")}</p>
        </div>
        <div className="flex gap-2">
          {isInternal && <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Edit className="w-4 h-4" /></Button>}
          {isInternal && <Button size="sm" variant="outline" className="text-red-400 border-red-500/30" onClick={deleteLead}><Trash2 className="w-4 h-4" /></Button>}
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-card border border-border rounded-lg p-4 mb-4">
        <p className="text-xs text-muted-label mb-3">Pipeline Stage</p>
        <div className="flex gap-1 flex-wrap">
          {STAGES.map((s, i) => (
            <button key={s} onClick={() => updateStage(s)} disabled={saving}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${lead.stage === s ? `${STAGE_COLORS[s]} text-white` : "bg-elevated text-muted-label border border-border hover:text-heading"}`}>
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border border-border rounded-lg p-5 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {lead.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-label" /><span className="text-body-text">{lead.email}</span></div>}
          {lead.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-label" /><span className="text-body-text">{lead.phone}</span></div>}
          {lead.lead_score > 0 && <div className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /><span className="text-heading font-bold">{lead.lead_score}/100</span></div>}
          {lead.last_contacted && <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-label" /><span className="text-body-text">Last contact: {lead.last_contacted}</span></div>}
          {lead.property_interest && <div className="col-span-2"><p className="text-xs text-muted-label mb-0.5">Interested In</p><p className="text-heading">{lead.property_interest}</p></div>}
          {(lead.budget_min || lead.budget_max) && <div className="col-span-2"><p className="text-xs text-muted-label mb-0.5">Budget</p><p className="text-heading">{lead.budget_min ? `$${lead.budget_min.toLocaleString()}` : "—"} – {lead.budget_max ? `$${lead.budget_max.toLocaleString()}` : "—"}/mo</p></div>}
          {lead.notes && <div className="col-span-2 bg-elevated rounded-lg p-3"><p className="text-xs text-muted-label mb-1">Notes</p><p className="text-sm text-body-text whitespace-pre-wrap">{lead.notes}</p></div>}
        </div>
      </div>
    </div>
  );
}