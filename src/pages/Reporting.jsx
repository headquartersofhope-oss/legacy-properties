import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { FileText, Users, UserCheck, BedDouble, AlertTriangle, ShieldCheck, DollarSign, Building, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['hsl(215, 65%, 45%)', 'hsl(160, 55%, 42%)', 'hsl(32, 80%, 50%)', 'hsl(280, 55%, 55%)', 'hsl(340, 65%, 50%)', 'hsl(45, 80%, 50%)'];

export default function Reporting() {
  const { isInternal } = useCurrentUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [referrals, residents, beds, incidents, compliance, fees, orgs] = await Promise.all([
      base44.entities.Referral.list(),
      base44.entities.HousingResident.list(),
      base44.entities.Bed.filter({ status: 'active' }),
      base44.entities.IncidentReport.list(),
      base44.entities.ComplianceCheck.list(),
      base44.entities.ProgramFee.list(),
      base44.entities.ReferringOrganization.list(),
    ]);

    // Referrals by status
    const refByStatus = {};
    referrals.forEach(r => { refByStatus[r.referral_status] = (refByStatus[r.referral_status] || 0) + 1; });

    // Referrals by org
    const refByOrg = {};
    referrals.forEach(r => {
      const org = r.referring_organization_name || 'Unknown';
      refByOrg[org] = (refByOrg[org] || 0) + 1;
    });

    // Incidents by type
    const incByType = {};
    incidents.forEach(i => { incByType[i.incident_type] = (incByType[i.incident_type] || 0) + 1; });

    // Occupancy
    const totalBeds = beds.length;
    const occupied = beds.filter(b => b.bed_status === 'occupied').length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    // Fees
    const totalFees = fees.reduce((sum, f) => sum + (f.amount || 0), 0);
    const paidFees = fees.filter(f => f.fee_status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0);
    const overdueFees = fees.filter(f => f.fee_status === 'overdue').reduce((sum, f) => sum + (f.amount || 0), 0);

    // Active residents
    const activeRes = residents.filter(r => r.resident_status === 'active').length;

    // Time to decision (avg days from submitted_at to decision_date)
    const decided = referrals.filter(r => r.submitted_at && r.decision_date);
    let avgDecisionDays = 0;
    if (decided.length > 0) {
      const totalDays = decided.reduce((sum, r) => {
        const diff = (new Date(r.decision_date) - new Date(r.submitted_at)) / (1000 * 60 * 60 * 24);
        return sum + Math.max(0, diff);
      }, 0);
      avgDecisionDays = Math.round(totalDays / decided.length);
    }

    setData({
      referrals, residents, beds, incidents, compliance, fees,
      refByStatus: Object.entries(refByStatus).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
      refByOrg: Object.entries(refByOrg).map(([name, value]) => ({ name, value })),
      incByType: Object.entries(incByType).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })),
      occupancyRate, activeRes, totalFees, paidFees, overdueFees, avgDecisionDays,
      compFollowUps: compliance.filter(c => c.follow_up_needed).length,
    });
    setLoading(false);
  }

  if (!isInternal) return <div className="text-center py-12 text-muted-foreground">Access restricted.</div>;

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div>
      <PageHeader title="Reporting" subtitle="Operational reports and summaries" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Referrals" value={data.referrals.length} icon={FileText} />
        <StatCard label="Active Residents" value={data.activeRes} icon={UserCheck} />
        <StatCard label="Occupancy Rate" value={`${data.occupancyRate}%`} icon={BedDouble} />
        <StatCard label="Avg Decision (days)" value={data.avgDecisionDays} icon={Clock} />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Referrals by Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.refByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(215, 65%, 45%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Referrals by Organization</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data.refByOrg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {data.refByOrg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Incidents by Type</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.incByType}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(340, 65%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Fee Summary</h3>
          <div className="space-y-4 mt-4">
            <StatCard label="Total Fees" value={`$${data.totalFees.toFixed(2)}`} icon={DollarSign} />
            <StatCard label="Paid" value={`$${data.paidFees.toFixed(2)}`} icon={DollarSign} />
            <StatCard label="Overdue" value={`$${data.overdueFees.toFixed(2)}`} icon={DollarSign} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total Incidents" value={data.incidents.length} icon={AlertTriangle} />
        <StatCard label="Compliance Follow-ups" value={data.compFollowUps} icon={ShieldCheck} />
        <StatCard label="Move-outs" value={data.residents.filter(r => r.actual_exit_date).length} icon={Users} />
      </div>
    </div>
  );
}