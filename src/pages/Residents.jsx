import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import ResidentDetail from "@/components/residents/ResidentDetail";

export default function Residents() {
  const { isInternal } = useCurrentUser();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await base44.entities.HousingResident.list('-created_date');
    setResidents(data);
    setLoading(false);
  }

  if (!isInternal) return <div className="text-center py-12 text-muted-foreground">Access restricted.</div>;

  const columns = [
    { header: "Name", cell: r => `${r.first_name} ${r.last_name}` },
    { header: "Site", accessor: "site_name" },
    { header: "Room", accessor: "room_name" },
    { header: "Bed", accessor: "bed_label" },
    { header: "Status", cell: r => <StatusBadge status={r.resident_status} /> },
    { header: "Move-In", cell: r => r.move_in_date || '—' },
  ];

  return (
    <div>
      <PageHeader title="Residents" subtitle="Manage current and past housing residents" />
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <DataTable columns={columns} data={residents} onRowClick={(r) => setSelected(r)} />
      )}
      {selected && (
        <ResidentDetail open={!!selected} onClose={() => setSelected(null)} resident={selected} onUpdated={() => { setSelected(null); load(); }} />
      )}
    </div>
  );
}