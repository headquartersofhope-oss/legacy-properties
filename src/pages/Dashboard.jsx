import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import StatCard from "@/components/StatCard";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import {
  Building2, DoorOpen, BedDouble, FileText, Users, UserCheck,
  AlertTriangle, ShieldCheck, DollarSign, Clock
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, isInternal, isPartner } = useCurrentUser();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  async function loadStats() {
    if (!user) return;

    if (isPartner) {
      const referrals = await base44.entities.Referral.filter({ referring_user_email: user.email });
      setStats({
        total: referrals.length,
        draft: referrals.filter(r => r.referral_status === 'draft').length,
        submitted: referrals.filter(r => ['submitted', 'received', 'under_review'].includes(r.referral_status)).length,
        moreInfo: referrals.filter(r => r.referral_status === 'more_information_requested').length,
        approved: referrals.filter(r => r.referral_status === 'approved').length,
        denied: referrals.filter(r => r.referral_status === 'denied').length,
        waitlisted: referrals.filter(r => r.referral_status === 'waitlisted').length,
      });
    } else if (isInternal) {
      const [sites, rooms, beds, referrals, residents, incidents, compliance, fees] = await Promise.all([
        base44.entities.HousingSite.list(),
        base44.entities.Room.list(),
        base44.entities.Bed.list(),
        base44.entities.Referral.list(),
        base44.entities.HousingResident.list(),
        base44.entities.IncidentReport.list(),
        base44.entities.ComplianceCheck.list(),
        base44.entities.ProgramFee.list(),
      ]);

      const activeSites = sites.filter(s => s.status === 'active');
      const activeRooms = rooms.filter(r => r.status === 'active');
      const activeBeds = beds.filter(b => b.status === 'active');
      const activeResidents = residents.filter(r => r.resident_status === 'active');
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.substring(0, 7);

      setStats({
        sites: activeSites.length,
        rooms: activeRooms.length,
        totalBeds: activeBeds.length,
        availableBeds: activeBeds.filter(b => b.bed_status === 'available').length,
        occupiedBeds: activeBeds.filter(b => b.bed_status === 'occupied').length,
        reservedBeds: activeBeds.filter(b => b.bed_status === 'reserved').length,
        oosBeds: activeBeds.filter(b => b.bed_status === 'out_of_service').length,
        pendingReferrals: referrals.filter(r => ['submitted', 'received', 'under_review'].includes(r.referral_status)).length,
        approvedReferrals: referrals.filter(r => r.referral_status === 'approved').length,
        deniedReferrals: referrals.filter(r => r.referral_status === 'denied').length,
        waitlistCount: referrals.filter(r => r.referral_status === 'waitlisted').length,
        activeResidents: activeResidents.length,
        moveInsThisMonth: residents.filter(r => r.move_in_date?.startsWith(thisMonth)).length,
        moveOutsThisMonth: residents.filter(r => r.actual_exit_date?.startsWith(thisMonth)).length,
        incidentsNeedingFollowUp: incidents.filter(i => i.follow_up_status === 'pending' || i.follow_up_status === 'in_progress').length,
        complianceDue: compliance.filter(c => c.follow_up_needed).length,
        overdueFees: fees.filter(f => f.fee_status === 'overdue').length,
      });
    } else {
      // Unknown role — no data loaded
      setStats({});
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartner && stats) {
    return (
      <div>
        <PageHeader title="Partner Dashboard" subtitle={`Welcome, ${user?.full_name || 'Partner'}`} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Referrals" value={stats.total} icon={FileText} />
          <StatCard label="Drafts" value={stats.draft} icon={Clock} />
          <StatCard label="In Review" value={stats.submitted} icon={FileText} />
          <StatCard label="More Info Needed" value={stats.moreInfo} icon={AlertTriangle} />
          <StatCard label="Approved" value={stats.approved} icon={UserCheck} />
          <StatCard label="Denied" value={stats.denied} icon={AlertTriangle} />
          <StatCard label="Waitlisted" value={stats.waitlisted} icon={Users} />
        </div>
        <div className="mt-6">
          <Link to="/referrals" className="text-sm text-primary hover:underline font-medium">View My Referrals →</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Housing Operations Dashboard" subtitle="Overview of all housing operations" />

      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Inventory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Active Sites" value={stats?.sites} icon={Building2} />
            <StatCard label="Active Rooms" value={stats?.rooms} icon={DoorOpen} />
            <StatCard label="Total Beds" value={stats?.totalBeds} icon={BedDouble} />
            <StatCard label="Available Beds" value={stats?.availableBeds} icon={BedDouble} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bed Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Occupied" value={stats?.occupiedBeds} icon={BedDouble} />
            <StatCard label="Reserved" value={stats?.reservedBeds} icon={BedDouble} />
            <StatCard label="Out of Service" value={stats?.oosBeds} icon={BedDouble} />
            <StatCard label="Occupancy Rate" value={stats?.totalBeds > 0 ? Math.round((stats?.occupiedBeds / stats?.totalBeds) * 100) + '%' : '0%'} icon={BedDouble} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Referrals & Residents</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Pending Referrals" value={stats?.pendingReferrals} icon={FileText} />
            <StatCard label="Approved" value={stats?.approvedReferrals} icon={FileText} />
            <StatCard label="Waitlisted" value={stats?.waitlistCount} icon={Users} />
            <StatCard label="Active Residents" value={stats?.activeResidents} icon={UserCheck} />
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Operations</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Move-ins (Month)" value={stats?.moveInsThisMonth} icon={UserCheck} />
            <StatCard label="Move-outs (Month)" value={stats?.moveOutsThisMonth} icon={Users} />
            <StatCard label="Incidents Follow-up" value={stats?.incidentsNeedingFollowUp} icon={AlertTriangle} />
            <StatCard label="Compliance Due" value={stats?.complianceDue} icon={ShieldCheck} />
          </div>
        </div>

        {stats?.overdueFees > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Alerts</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Overdue Fees" value={stats?.overdueFees} icon={DollarSign} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}