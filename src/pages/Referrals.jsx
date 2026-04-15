import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Plus, Send } from "lucide-react";
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

  useEffect(() => { load(); }, [user]);

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

  return (
    <div>
      <PageHeader title={isPartner ? "My Referrals" : "Referrals"} subtitle={isPartner ? "View and manage your referrals" : "Manage incoming referrals"}>
        {(isPartner || isInternal) && (
          <Button onClick={() => { setEditRef(null); setShowForm(true); }}>
            <Plus className="w-4 h-4 mr-2" /> New Referral
          </Button>
        )}
      </PageHeader>

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
      ) : (
        <DataTable columns={columns} data={referrals} onRowClick={(r) => setShowDetail(r)} />
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