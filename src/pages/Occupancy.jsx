import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import AccessDenied from "@/components/AccessDenied";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";

export default function Occupancy() {
  const { isInternal } = useCurrentUser();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.OccupancyRecord.list('-created_date');
    setRecords(data);
    setLoading(false);
  }

  if (!isInternal) return <AccessDenied message="Occupancy records are restricted to internal housing staff only." />;

  const columns = [
    { header: "Resident", accessor: "resident_name" },
    { header: "Site", accessor: "site_name" },
    { header: "Room", accessor: "room_name" },
    { header: "Bed", accessor: "bed_label" },
    { header: "Start", accessor: "start_date" },
    { header: "End", cell: r => r.end_date || '—' },
    { header: "Status", cell: r => <StatusBadge status={r.occupancy_status} /> },
  ];

  return (
    <div>
      <PageHeader title="Occupancy Records" subtitle="Historical and active occupancy tracking" />
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={records} />
      )}
    </div>
  );
}