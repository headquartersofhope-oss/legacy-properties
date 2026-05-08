import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Clock, User, Building2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ShowingForm from "@/components/crm/ShowingForm";

const STATUS_COLORS = {
  scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  confirmed: "bg-green-500/20 text-green-400 border border-green-500/30",
  completed: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  cancelled: "bg-red-500/20 text-red-400 border border-red-500/30",
  no_show: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
};

const OUTCOME_ICONS = {
  interested: <CheckCircle className="w-4 h-4 text-green-400" />,
  applied: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  not_interested: <XCircle className="w-4 h-4 text-red-400" />,
  needs_follow_up: <AlertCircle className="w-4 h-4 text-amber-400" />,
  pending: <Clock className="w-4 h-4 text-muted-label" />,
};

export default function ShowingScheduler() {
  const { user, isInternal } = useCurrentUser();
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editShowing, setEditShowing] = useState(null);
  const [dateFilter, setDateFilter] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => { if (user) loadShowings(); }, [user]);

  async function loadShowings() {
    setLoading(true);
    const data = await base44.entities.Showing.list("-showing_date");
    setShowings(data);
    setLoading(false);
  }

  const today = new Date().toISOString().split("T")[0];

  const filtered = showings.filter(s => {
    const dateMatch = dateFilter === "all" ? true :
      dateFilter === "upcoming" ? s.showing_date >= today :
      dateFilter === "past" ? s.showing_date < today :
      s.showing_date === today;
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return dateMatch && statusMatch;
  });

  const stats = {
    upcoming: showings.filter(s => s.showing_date >= today && !["cancelled"].includes(s.status)).length,
    today: showings.filter(s => s.showing_date === today).length,
    completed: showings.filter(s => s.status === "completed").length,
    converted: showings.filter(s => s.outcome === "applied").length,
  };

  async function updateStatus(id, status) {
    await base44.entities.Showing.update(id, { status });
    loadShowings();
  }

  async function updateOutcome(id, outcome) {
    await base44.entities.Showing.update(id, { outcome, status: "completed" });
    loadShowings();
  }

  if (showForm || editShowing) return (
    <ShowingForm
      showing={editShowing}
      onSave={() => { setShowForm(false); setEditShowing(null); loadShowings(); }}
      onCancel={() => { setShowForm(false); setEditShowing(null); }}
    />
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-heading">Showing Scheduler</h1>
          <p className="text-muted-label text-sm mt-1">Property tours & visit management</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="w-4 h-4" /> Schedule Showing</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Upcoming", value: stats.upcoming, color: "blue" },
          { label: "Today", value: stats.today, color: "violet" },
          { label: "Completed", value: stats.completed, color: "green" },
          { label: "Converted", value: stats.converted, color: "emerald" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
            <p className="text-xs text-muted-label mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <div className="flex gap-1 rounded-lg border border-border overflow-hidden bg-elevated">
          {["upcoming","today","past","all"].map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${dateFilter === f ? "bg-primary text-white" : "text-muted-label hover:text-heading"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all","scheduled","confirmed","completed","cancelled","no_show"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${statusFilter === s ? "bg-primary text-white" : "bg-elevated text-muted-label hover:text-heading border border-border"}`}>
              {s === "all" ? "All" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-label">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No showings found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start gap-4">
                {/* Date block */}
                <div className="flex-shrink-0 w-14 bg-elevated rounded-lg border border-border text-center py-2">
                  <p className="text-[10px] text-muted-label uppercase">{new Date(s.showing_date + "T12:00:00").toLocaleDateString("en-US", { month: "short" })}</p>
                  <p className="text-xl font-bold text-heading leading-none">{new Date(s.showing_date + "T12:00:00").getDate()}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-heading text-sm">{s.lead_name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLORS[s.status]}`}>{s.status?.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex gap-4 mt-1 text-[11px] text-muted-label flex-wrap">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{s.property_name}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.showing_time} ({s.duration_minutes || 30} min)</span>
                    {s.assigned_staff_name && <span className="flex items-center gap-1"><User className="w-3 h-3" />{s.assigned_staff_name}</span>}
                  </div>
                  {s.notes && <p className="text-xs text-muted-label mt-1 truncate">{s.notes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {s.outcome && s.outcome !== "pending" && (
                    <div className="flex items-center gap-1">
                      {OUTCOME_ICONS[s.outcome]}
                      <span className="text-[10px] text-muted-label capitalize">{s.outcome.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  <div className="flex gap-1">
                    {s.status === "scheduled" && (
                      <>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => updateStatus(s.id, "confirmed")}>Confirm</Button>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2 text-red-400 border-red-500/30" onClick={() => updateStatus(s.id, "cancelled")}>Cancel</Button>
                      </>
                    )}
                    {s.status === "confirmed" && (
                      <>
                        <select className="text-[10px] bg-elevated border border-border rounded px-1 py-0.5 text-heading"
                          onChange={e => e.target.value && updateOutcome(s.id, e.target.value)}
                          defaultValue="">
                          <option value="" disabled>Outcome…</option>
                          <option value="interested">Interested</option>
                          <option value="applied">Applied</option>
                          <option value="not_interested">Not Interested</option>
                          <option value="needs_follow_up">Follow Up</option>
                        </select>
                      </>
                    )}
                    <Button size="sm" variant="outline" className="text-[10px] h-6 px-2" onClick={() => setEditShowing(s)}>Edit</Button>
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