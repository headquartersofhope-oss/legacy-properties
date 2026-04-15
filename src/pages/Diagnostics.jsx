import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import { AlertTriangle, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDenied from "@/components/AccessDenied";

export default function Diagnostics() {
  const { isAdmin, isManager } = useCurrentUser();
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin && !isManager) {
    return <AccessDenied message="Diagnostics are restricted to admins and managers." />;
  }

  async function runDiagnostics() {
    setLoading(true);
    try {
      const [properties, leases, owners, beds, applications, residents] = await Promise.all([
        base44.entities.Property.list(),
        base44.entities.Lease.list(),
        base44.entities.PropertyOwner.list(),
        base44.entities.Bed.list(),
        base44.entities.HousingApplication.list(),
        base44.entities.HousingResident.list(),
      ]);

      const issues = [];
      const warnings = [];
      const info = [];

      // Property checks
      properties.forEach(p => {
        if (!p.property_name) issues.push(`Property ${p.id}: Missing name`);
        if (!p.full_address) warnings.push(`Property ${p.property_name}: Missing address`);
        if (!p.total_bed_count || p.total_bed_count === 0) warnings.push(`Property ${p.property_name}: No bed count defined`);
        if (p.house_status === 'active' && !p.visible_to_partners) info.push(`Property ${p.property_name}: Active but not visible to partners`);
      });

      // Lease checks
      leases.forEach(l => {
        if (!l.property_id) issues.push(`Lease ${l.id}: Missing property`);
        if (!l.owner_id) warnings.push(`Lease ${l.id}: Missing owner`);
        if (!l.lease_start_date) warnings.push(`Lease ${l.id}: Missing start date`);
        if (l.renewal_status === 'expired') warnings.push(`Lease ${l.id}: Expired`);
      });

      // Owner checks
      owners.forEach(o => {
        if (!o.owner_name) issues.push(`Owner ${o.id}: Missing name`);
        if (!o.agreement_status || o.agreement_status === 'terminated') warnings.push(`Owner ${o.owner_name}: No active agreement`);
      });

      // Bed checks
      beds.forEach(b => {
        if (!b.room_id) issues.push(`Bed ${b.id}: Missing room assignment`);
        if (!b.site_id) issues.push(`Bed ${b.id}: Missing site assignment`);
      });

      // Application checks
      applications.forEach(a => {
        if (a.documents_status === 'incomplete' && a.application_status !== 'new') warnings.push(`Application ${a.id} (${a.applicant_first_name}): Documents incomplete`);
        if (a.documents_status === 'issues') issues.push(`Application ${a.id} (${a.applicant_first_name}): Document issues flagged`);
      });

      // Resident checks
      residents.forEach(r => {
        if (!r.bed_id && r.resident_status === 'active') issues.push(`Resident ${r.id} (${r.first_name}): Active but no bed assigned`);
        if (!r.site_id && r.resident_status === 'active') issues.push(`Resident ${r.id} (${r.first_name}): Active but no site assigned`);
      });

      const summary = {
        properties: properties.length,
        leases: leases.length,
        owners: owners.length,
        beds: beds.length,
        applications: applications.length,
        residents: residents.length,
        criticalIssues: issues.length,
        warnings: warnings.length,
        infoItems: info.length,
        issues,
        warnings,
        info,
        lastRun: new Date().toLocaleString(),
        health: issues.length === 0 ? 'healthy' : issues.length <= 3 ? 'warning' : 'critical',
      };

      setDiagnostics(summary);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  return (
    <div>
      <PageHeader title="System Diagnostics" subtitle="Check housing app health and readiness">
        <Button onClick={runDiagnostics} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Running...' : 'Run Full Diagnostic'}
        </Button>
      </PageHeader>

      {!diagnostics ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Run Full Diagnostic" to check system health and readiness.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Health Summary */}
          <div className={`rounded-lg p-6 border ${diagnostics.health === 'healthy' ? 'bg-green-50 border-green-200' : diagnostics.health === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center gap-3">
              {diagnostics.health === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              )}
              <div>
                <h3 className="font-semibold text-foreground capitalize">{diagnostics.health} Status</h3>
                <p className="text-sm text-muted-foreground">Last checked: {diagnostics.lastRun}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Properties', value: diagnostics.properties },
              { label: 'Leases', value: diagnostics.leases },
              { label: 'Owners', value: diagnostics.owners },
              { label: 'Beds', value: diagnostics.beds },
              { label: 'Applications', value: diagnostics.applications },
              { label: 'Residents', value: diagnostics.residents },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Issues */}
          {diagnostics.issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Critical Issues ({diagnostics.criticalIssues})
              </h3>
              <ul className="space-y-1 text-sm text-red-800">
                {diagnostics.issues.map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {diagnostics.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Warnings ({diagnostics.warnings.length})
              </h3>
              <ul className="space-y-1 text-sm text-yellow-800">
                {diagnostics.warnings.map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Info */}
          {diagnostics.info.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Information ({diagnostics.info.length})
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                {diagnostics.info.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="bg-card border border-border rounded-lg p-4 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium">Readiness:</span> {diagnostics.criticalIssues === 0 ? '✓ Ready for production' : `⚠ Resolve ${diagnostics.criticalIssues} issue(s) before go-live`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}