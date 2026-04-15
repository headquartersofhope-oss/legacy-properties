import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Send, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReferralForm from "@/components/referrals/ReferralForm";
import ReferralDetail from "@/components/referrals/ReferralDetail";
import EmptyState from "@/components/EmptyState";

export default function Referrals() {
  const { user, isInternal, isPartner } = useCurrentUser();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editRef, setEditRef] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  useEffect(() => { 
    load();

    // Load navigation filters
    const navFilters = sessionStorage.getItem('navigationFilters');
    if (navFilters) {
      const filters = JSON.parse(navFilters);
      if (filters.status) setStatusFilter(filters.status);
      sessionStorage.removeItem('navigationFilters');
    }
  }, [user]);

  async function load() {
    if (!user) return;
    let data;
    if (isPartner) {
      data = await base44.entities.Referral.filter({ referring_user_email: user.email }, '-created_date');
    } else {
      data = await base44.entities.Referral.list('-created_date');
    }
    setReferrals(data);
    setLoading(false);
  }

  const columns = [
    { header: "Name", cell: r => `${r.applicant_first_name} ${r.applicant_last_name}` },
    { header: "Status", cell: r => <StatusBadge status={r.referral_status} /> },
    { header: "Priority", cell: r => <StatusBadge status={r.priority_level} /> },
    ...(isInternal ? [{ header: "Referring Org", accessor: "referring_organization_name" }] : []),
    { header: "Submitted", cell: r => r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—' },
    ...(isPartner ? [{ header: "Notes", accessor: "partner_visible_notes" }] : []),
  ];

  let displayReferrals = referrals;
  if (statusFilter) {
    displayReferrals = displayReferrals.filter(r => r.referral_status === statusFilter);
  }

  const hasActiveFilters = statusFilter;

  return (
    <div className="space-y-6">
      <PageHeader title={isPartner ? "My Referrals" : "Referrals"} subtitle={`${displayReferrals.length} of ${referrals.length} referrals`}>
        {(isPartner || isInternal) && (
          <Button onClick={() => { setEditRef(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Referral
          </Button>
        )}
      </PageHeader>

      {/* Status Filter */}
      {referrals.length > 0 && (
        <div className="bg-card border-2 border-border rounded-lg p-4">
          <div className="space-y-3">
            {hasActiveFilters && (
              <div className="text-xs text-muted-foreground font-medium">
                Filter active (1)
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter || ""} onValueChange={(v) => setStatusFilter(v || null)}>
                <SelectTrigger className="w-40 h-8 text-xs">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="denied">Denied</SelectItem>
                  <SelectItem value="waitlisted">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setStatusFilter(null)}
                  className="h-8 text-xs"
                >
                  <X className="w-3 h-3 mr-1" /> Clear filter
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : referrals.length === 0 ? (
        <EmptyState
          icon={Send}
          title="No referrals yet"
          description={isPartner ? "Submit a new referral to place a client in housing." : "No incoming referrals. Partners will submit referrals here."}
          actionLabel={isPartner ? "New Referral" : undefined}
          onAction={isPartner ? () => { setEditRef(null); setShowForm(true); } : undefined}
        />
      ) : displayReferrals.length === 0 ? (
        <EmptyState
          icon={Send}
          title={`No ${statusFilter} referrals`}
          description="Try adjusting your filter to see more referrals."
          actionLabel="Clear filter"
          onAction={() => setStatusFilter(null)}
        />
      ) : (
        <DataTable columns={columns} data={displayReferrals} onRowClick={(r) => setShowDetail(r)} />
      )}

      {showForm && (
        <ReferralForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
          referral={editRef}
          isPartner={isPartner}
          user={user}
        />
      )}

      {showDetail && (
        <ReferralDetail
          open={!!showDetail}
          onClose={() => setShowDetail(null)}
          referral={showDetail}
          isInternal={isInternal}
          isPartner={isPartner}
          onUpdated={() => { setShowDetail(null); load(); }}
        />
      )}
    </div>
  );
}