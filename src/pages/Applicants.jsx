import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import AccessDenied from "@/components/AccessDenied";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ApplicantDetail from "@/components/applicants/ApplicantDetail";

export default function Applicants() {
  const { isInternal } = useCurrentUser();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.HousingApplicant.list('-created_date');
    setApplicants(data);
    setLoading(false);
  }

  if (!isInternal) return <AccessDenied message="Applicant records are restricted to internal housing staff only." />;

  const columns = [
    { header: "Name", cell: r => `${r.first_name} ${r.last_name}` },
    { header: "Intake Status", cell: r => <StatusBadge status={r.intake_status} /> },
    { header: "Applicant Status", cell: r => <StatusBadge status={r.applicant_status} /> },
    { header: "Documents", cell: r => <StatusBadge status={r.documents_status} /> },
    { header: "House Rules", cell: r => r.house_rules_signed ? '✓ Signed' : '—' },
  ];

  return (
    <div>
      <PageHeader title="Applicants" subtitle="Manage housing applicants and intake process" />
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={applicants} onRowClick={(r) => setSelected(r)} />
      )}
      {selected && (
        <ApplicantDetail open={!!selected} onClose={() => setSelected(null)} applicant={selected} onUpdated={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}