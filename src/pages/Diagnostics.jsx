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
      const result = await base44.functions.invoke('runFullDiagnostics', {});
      setDiagnostics(result.data);
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
          <p>Click "Run Full Diagnostic" to check system health and integration readiness.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Readiness Summary */}
          <div className={`rounded-lg p-6 border ${
            diagnostics.readiness_status === 'ready' ? 'bg-green-50 border-green-200' :
            diagnostics.readiness_status === 'ready_with_warnings' ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              {diagnostics.readiness_status === 'ready' ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-semibold text-foreground capitalize">{diagnostics.readiness_status.replace(/_/g, ' ')} for Production</h3>
                <p className="text-sm text-muted-foreground mt-1">{diagnostics.next_steps}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Properties', value: diagnostics.summary?.properties_count || 0 },
              { label: 'Leases', value: diagnostics.summary?.leases_count || 0 },
              { label: 'Beds', value: diagnostics.summary?.beds_count || 0 },
              { label: 'Applications', value: diagnostics.summary?.applications_count || 0 },
              { label: 'Residents', value: diagnostics.summary?.residents_count || 0 },
              { label: 'Referrals', value: diagnostics.summary?.referrals_count || 0 },
              { label: 'Documents', value: diagnostics.summary?.documents_count || 0 },
              { label: 'Occupancy Records', value: diagnostics.summary?.documents_count || 0 },
            ].map(stat => (
              <div key={stat.label} className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Data Quality */}
          {diagnostics.data_quality && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Data Quality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Property Completeness', value: diagnostics.data_quality.property_completeness },
                  { label: 'Lease Completeness', value: diagnostics.data_quality.lease_completeness },
                  { label: 'Occupancy Match', value: diagnostics.data_quality.occupancy_match_percent },
                  { label: 'Bed Inventory Match', value: diagnostics.data_quality.bed_inventory_match_percent },
                ].map(metric => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium text-foreground">{metric.value}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${
                        metric.value >= 90 ? 'bg-green-500' :
                        metric.value >= 75 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} style={{ width: `${metric.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Integration Readiness */}
          {diagnostics.pathway_readiness && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pathway */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Pathway Readiness</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${diagnostics.pathway_readiness.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span className="text-sm capitalize">{diagnostics.pathway_readiness.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p><strong>Completeness:</strong> {diagnostics.pathway_readiness.completeness_percent}%</p>
                    {diagnostics.pathway_readiness.missing_fields?.length > 0 && (
                      <p><strong>Missing:</strong> {diagnostics.pathway_readiness.missing_fields.slice(0, 2).join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Document Readiness</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${diagnostics.document_readiness.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span className="text-sm capitalize">{diagnostics.document_readiness.status}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>Google Drive: {diagnostics.document_readiness.drive_integration_ready ? '✓ Ready' : '✗ Not ready'}</p>
                    <p>Types: {diagnostics.document_readiness.document_types_covered?.length || 0} covered</p>
                  </div>
                </div>
              </div>

              {/* Automation */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Automation Readiness</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${diagnostics.automation_readiness.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span className="text-sm capitalize">{diagnostics.automation_readiness.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Zapier: {diagnostics.automation_readiness.zapier_ready ? '✓' : '✗'}</p>
                    <p>Twilio: {diagnostics.automation_readiness.twilio_ready ? '✓' : '✗'}</p>
                    <p>Email: {diagnostics.automation_readiness.email_automation_ready ? '✓' : '✗'}</p>
                  </div>
                </div>
              </div>

              {/* Occupancy */}
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Occupancy Verification</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${diagnostics.data_quality.occupancy_match_percent === 100 ? 'text-green-600' : 'text-yellow-600'}`} />
                    <span className="text-sm">{diagnostics.data_quality.occupancy_match_percent}% Match</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    All occupied beds linked to active residents
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {diagnostics.critical_issues && diagnostics.critical_issues.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Critical Issues ({diagnostics.critical_issues.length})
              </h3>
              <ul className="space-y-1 text-sm text-red-800">
                {diagnostics.critical_issues.slice(0, 15).map((issue, i) => (
                  <li key={i}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {diagnostics.warnings && diagnostics.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Warnings ({diagnostics.warnings.length})
              </h3>
              <ul className="space-y-1 text-sm text-yellow-800">
                {diagnostics.warnings.slice(0, 10).map((warning, i) => (
                  <li key={i}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {diagnostics.recommendations && diagnostics.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Recommendations ({diagnostics.recommendations.length})
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                {diagnostics.recommendations.slice(0, 10).map((rec, i) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}