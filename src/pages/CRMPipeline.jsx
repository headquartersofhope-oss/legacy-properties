import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Plus, User, Phone, Mail, Star, Calendar, TrendingUp, Filter, X, ChevronRight } from "lucide-react";
import LeadForm from "@/components/crm/LeadForm";
import LeadDetail from "@/components/crm/LeadDetail";

const STAGES = [
  { id: "new", label: "New", color: "bg-slate-500" },
  { id: "contacted", label: "Contacted", color: "bg-blue-500" },
  { id: "qualified", label: "Qualified", color: "bg-indigo-500" },
  { id: "showing_scheduled", label: "Showing", color: "bg-violet-500" },
  { id: "application_submitted", label: "Applied", color: "bg-amber-500" },
  { id: "approved", label: "Approved", color: "bg-green-500" },
  { id: "closed_won", label: "Won", color: "bg-emerald-600" },
  { id: "closed_lost", label: "Lost", color: "bg-red-500" },
];

const SCORE_COLOR = (score) => {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
};

export default function CRMPipeline() {
  const { user, isInternal } = useCurrentUser();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("kanban"); // kanban | list
  const [sourceFilter, setSourceFilter] = useState("all");

  useEffect(() => { if (user) loadLeads(); }, [user]);

  async function loadLeads() {
    setLoading(true);
    const data = await base44.entities.Lead.list("-created_date");
    setLeads(data);
    setLoading(false);
  }

  const filtered = sourceFilter === "all" ? leads : leads.filter(l => l.source === sourceFilter);

  const stats = {
    total: leads.length,
    active: leads.filter(l => !["closed_won","closed_lost"].includes(l.stage)).length,
    won: leads.filter(l => l.stage === "closed_won").length,
    avgScore: leads.length ? Math.round(leads.reduce((s, l) => s + (l.lead_score || 0), 0) / leads.length) : 0,
  };

  if (selected) return <LeadDetail lead={selected} onBack={() => { setSelected(null); loadLeads(); }} isInternal={isInternal} />;
  if (showForm) return <LeadForm onSave={() => { setShowForm(false); loadLeads(); }} onCancel={() => setShowForm(false)} />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-heading">CRM Pipeline</h1>
          <p className="text-muted-label text-sm mt-1">Leads, prospects & sales pipeline</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("kanban")} className={`px-3 py-1.5 text-xs font-medium ${view === "kanban" ? "bg-primary text-white" : "bg-elevated text-muted-label"}`}>Kanban</button>
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-primary text-white" : "bg-elevated text-muted-label"}`}>List</button>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Lead</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Leads", value: stats.total, icon: User, color: "blue" },
          { label: "Active Leads", value: stats.active, icon: TrendingUp, color: "green" },
          { label: "Closed Won", value: stats.won, icon: Star, color: "amber" },
          { label: "Avg Score", value: stats.avgScore, icon: Star, color: "violet" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-${color}-500/20 flex items-center justify-center`}>
              <Icon className={`w-5 h-5 text-${color}-400`} />
            </div>
            <div><p className="text-2xl font-bold text-heading">{value}</p><p className="text-xs text-muted-label">{label}</p></div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : view === "kanban" ? (
        <KanbanView leads={filtered} onSelect={setSelected} onRefresh={loadLeads} />
      ) : (
        <ListView leads={filtered} onSelect={setSelected} sourceFilter={sourceFilter} setSourceFilter={setSourceFilter} />
      )}
    </div>
  );
}

function KanbanView({ leads, onSelect, onRefresh }) {
  const handleDrop = async (leadId, newStage) => {
    await base44.entities.Lead.update(leadId, { stage: newStage });
    onRefresh();
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.stage === stage.id);
        return (
          <div key={stage.id}
            className="flex-shrink-0 w-56 bg-elevated rounded-lg border border-border"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData("leadId"); handleDrop(id, stage.id); }}>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                <span className="text-xs font-semibold text-heading">{stage.label}</span>
              </div>
              <span className="text-xs bg-card border border-border px-1.5 py-0.5 rounded-full text-muted-label">{stageLeads.length}</span>
            </div>
            <div className="p-2 space-y-2 min-h-[200px]">
              {stageLeads.map(lead => (
                <div key={lead.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData("leadId", lead.id)}
                  onClick={() => onSelect(lead)}
                  className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 transition-all shadow-sm">
                  <p className="text-xs font-semibold text-heading truncate">{lead.first_name} {lead.last_name}</p>
                  {lead.property_interest && <p className="text-[10px] text-muted-label truncate mt-0.5">{lead.property_interest}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-label capitalize">{lead.source?.replace(/_/g, " ") || "—"}</span>
                    {lead.lead_score > 0 && <span className={`text-[10px] font-bold ${SCORE_COLOR(lead.lead_score)}`}>★ {lead.lead_score}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ListView({ leads, onSelect, sourceFilter, setSourceFilter }) {
  const sources = ["all", "website", "referral", "social_media", "walk_in", "phone_call", "partner", "other"];
  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {sources.map(s => (
          <button key={s} onClick={() => setSourceFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${sourceFilter === s ? "bg-primary text-white" : "bg-elevated text-muted-label hover:text-heading border border-border"}`}>
            {s === "all" ? "All Sources" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {leads.map(lead => {
          const stage = STAGES.find(s => s.id === lead.stage);
          return (
            <div key={lead.id} onClick={() => onSelect(lead)}
              className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-all flex items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                {lead.first_name?.[0]}{lead.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-heading text-sm">{lead.first_name} {lead.last_name}</p>
                <div className="flex gap-3 text-[11px] text-muted-label mt-0.5 flex-wrap">
                  {lead.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{lead.email}</span>}
                  {lead.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
                  {lead.property_interest && <span>{lead.property_interest}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {lead.lead_score > 0 && <span className={`text-sm font-bold ${SCORE_COLOR(lead.lead_score)}`}>★ {lead.lead_score}</span>}
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${stage?.color || "bg-slate-500"}`} />
                  <span className="text-xs text-muted-label">{stage?.label || lead.stage}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-label" />
              </div>
            </div>
          );
        })}
        {leads.length === 0 && (
          <div className="text-center py-16 text-muted-label">
            <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No leads found</p>
          </div>
        )}
      </div>
    </div>
  );
}