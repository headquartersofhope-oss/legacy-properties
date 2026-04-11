import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function Settings() {
  const { isAdmin, user } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!isAdmin) { setLoading(false); return; }
    const [u, p] = await Promise.all([
      base44.entities.User.list(),
      base44.entities.HousingProvider.list(),
    ]);
    setUsers(u);
    setProviders(p);
    setLoading(false);
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Admin access required.</p>
      </div>
    );
  }

  const userColumns = [
    { header: "Name", accessor: "full_name" },
    { header: "Email", accessor: "email" },
    { header: "Role", cell: r => <StatusBadge status={r.role} /> },
    { header: "Referring Org", cell: r => r.referring_organization_name || '—' },
  ];

  const providerColumns = [
    { header: "Name", accessor: "name" },
    { header: "Legal Entity", accessor: "legal_entity_name" },
    { header: "Status", cell: r => <StatusBadge status={r.status} /> },
    { header: "City", accessor: "city" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeader title="Settings" subtitle="Admin settings and user management" />

        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-sm font-semibold mb-2">Current User</h3>
          <div className="text-sm space-y-1">
            <p><span className="text-muted-foreground">Name:</span> {user?.full_name}</p>
            <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
            <p><span className="text-muted-foreground">Role:</span> <StatusBadge status={user?.role} /></p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">App Users</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <DataTable columns={userColumns} data={users} />
        )}
        <p className="text-xs text-muted-foreground mt-2">To invite users or change roles, go to the Base44 dashboard → Users.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Housing Providers</h2>
        <DataTable columns={providerColumns} data={providers} emptyMessage="No providers configured." />
        <p className="text-xs text-muted-foreground mt-2">Providers can be configured to support multi-provider operations.</p>
      </div>
    </div>
  );
}