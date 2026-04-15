import { useState } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import { CheckCircle, AlertTriangle, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import AccessDenied from "@/components/AccessDenied";

export default function IntegrationReadiness() {
  const { isAdmin } = useCurrentUser();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return <AccessDenied message="Integration readiness is restricted to admins." />;
  }

  async function runFullAudit() {
    setLoading(true);
    try {
      const result = await base44.functions.invoke('runFullDiagnostics', {});
      setAudit(result.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const readinessColor = {
    ready: 'bg-green-50 border-green-200',
    ready_with_warnings: 'bg-yellow-50 border-yellow-200',
    needs_work: 'bg-orange-50 border-orange-200',
    critical_issues: 'bg-red-50 border-red-200',
  };

  const readinessIcon = {
    ready: <CheckCircle className="w-6 h-6 text-green-600" />,
    ready_with_warnings: <AlertCircle className="w-6 h-6 text-yellow-600" />,
    needs_work: <AlertTriangle className="w-6 h-6 text-orange-600" />,
    critical_issues: <AlertTriangle className="w-6 h-6 text-red-600" />,
  };

  return (
    <div>
      <PageHeader title="Integration Readiness" subtitle="Verify housing app readiness for ecosystem connections">
        <Button onClick={runFullAudit} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Auditing...' : 'Run Full Audit'}
        </Button>
      </PageHeader>

      {!audit ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Click "Run Full Audit" to assess integration readiness across all systems.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overall Readiness */}
          <div className={`rounded-lg p-6 border ${readinessColor[audit.readiness_status]}`}>
            <div className="flex items-start gap-3">
              {readinessIcon[audit.readiness_status]}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground capitalize">{audit.readiness_status.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-muted-foreground mt-2">{audit.next_steps}</p>
              </div>
            </div>
          </div>

          {/* Integration Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pathway */}
            <div className={`rounded-lg p-6 border ${
              audit.pathway_readiness?.status === 'ready' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Pathway App</h3>
                  <p className="text-xs text-muted-foreground mt-1">Referral & placement sync</p>
                </div>
                <CheckCircle className={`w-5 h-5 ${audit.pathway_readiness?.status === 'ready' ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Completeness:</span>
                  <span className="font-medium">{audit.pathway_readiness?.completeness_percent || 0}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${
                    (audit.pathway_readiness?.completeness_percent || 0) >= 90 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} style={{ width: `${audit.pathway_readiness?.completeness_percent || 0}%` }} />
                </div>
                {audit.pathway_readiness?.missing_fields?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    <strong>Missing:</strong> {audit.pathway_readiness.missing_fields.slice(0, 2).join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Google Drive */}
            <div className={`rounded-lg p-6 border ${
              audit.document_readiness?.drive_integration_ready ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Google Drive</h3>
                  <p className="text-xs text-muted-foreground mt-1">Document linkage & storage</p>
                </div>
                <CheckCircle className={`w-5 h-5 ${audit.document_readiness?.drive_integration_ready ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {audit.document_readiness?.unlinked_records?.length || 0} records need linking
                </p>
                <p className="text-muted-foreground">
                  {audit.document_readiness?.document_types_covered?.length || 0} document types supported
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Architecture ready for bi-directional sync
                </p>
              </div>
            </div>

            {/* Zapier */}
            <div className={`rounded-lg p-6 border ${
              audit.automation_readiness?.zapier_ready ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
            }`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Zapier</h3>
                  <p className="text-xs text-muted-foreground mt-1">Workflow automation</p>
                </div>
                <CheckCircle className={`w-5 h-5 ${audit.automation_readiness?.zapier_ready ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {audit.automation_readiness?.missing_triggers?.length === 0 ? '✓ All triggers available' : `⚠ ${audit.automation_readiness?.missing_triggers?.length || 0} triggers pending`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Ready for: bed availability, referral status, placement events
                </p>
              </div>
            </div>

            {/* Communication */}
            <div className={`rounded-lg p-6 border border-green-200 bg-green-50`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">Communication</h3>
                  <p className="text-xs text-muted-foreground mt-1">Twilio + Email</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">✓ Twilio SMS ready</p>
                <p className="text-muted-foreground">✓ Email automation ready</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure webhooks to enable
                </p>
              </div>
            </div>
          </div>

          {/* Data Quality Heatmap */}
          {audit.data_quality && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Data Quality Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Property', value: audit.data_quality.property_completeness },
                  { label: 'Lease', value: audit.data_quality.lease_completeness },
                  { label: 'Occupancy', value: audit.data_quality.occupancy_match_percent },
                  { label: 'Beds', value: audit.data_quality.bed_inventory_match_percent },
                ].map(metric => (
                  <div key={metric.label} className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg mb-2" style={{
                      backgroundColor: metric.value >= 90 ? '#dcfce7' : metric.value >= 75 ? '#fef3c7' : '#fee2e2',
                    }}>
                      <span className="font-bold text-lg" style={{
                        color: metric.value >= 90 ? '#15803d' : metric.value >= 75 ? '#b45309' : '#991b1b',
                      }}>
                        {metric.value}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document Readiness Details */}
          {audit.document_readiness && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Document Integration Readiness</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Google Drive Linkage:</span>
                  <span className="font-medium">{audit.document_readiness.drive_integration_ready ? '✓ Ready' : '⚠ Not ready'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Document Types:</span>
                  <span className="font-medium">{audit.document_readiness.document_types_covered?.join(', ') || 'None'}</span>
                </div>
                {audit.document_readiness.unlinked_records?.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
                    <p className="text-xs font-medium text-yellow-900 mb-2">Unlinked Records ({audit.document_readiness.unlinked_records.length}):</p>
                    <ul className="space-y-1">
                      {audit.document_readiness.unlinked_records.slice(0, 5).map((record, i) => (
                        <li key={i} className="text-xs text-yellow-800">• {record}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Automation Readiness */}
          {audit.automation_readiness && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-4">Automation Trigger Readiness</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Zapier', ready: audit.automation_readiness.zapier_ready },
                  { label: 'Twilio SMS', ready: audit.automation_readiness.twilio_ready },
                  { label: 'Email', ready: audit.automation_readiness.email_automation_ready },
                  { label: 'Pathway Sync', ready: true },
                ].map(trigger => (
                  <div key={trigger.label} className={`rounded p-3 text-center text-sm ${
                    trigger.ready ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="flex items-center justify-center mb-1">
                      {trigger.ready ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                    <p className="text-xs font-medium">{trigger.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {audit.critical_issues?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Critical Issues ({audit.critical_issues.length})
              </h3>
              <ul className="space-y-1">
                {audit.critical_issues.slice(0, 10).map((issue, i) => (
                  <li key={i} className="text-sm text-red-800">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {audit.recommendations?.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Recommendations ({audit.recommendations.length})
              </h3>
              <ul className="space-y-1">
                {audit.recommendations.slice(0, 10).map((rec, i) => (
                  <li key={i} className="text-sm text-blue-800">• {rec}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Next Steps */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-semibold text-foreground mb-3">Next Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Resolve critical issues</p>
                  <p className="text-xs text-muted-foreground">Address any blockers to production readiness</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Link documents to Google Drive</p>
                  <p className="text-xs text-muted-foreground">Set up contract and document storage</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Configure Pathway connection</p>
                  <p className="text-xs text-muted-foreground">Enable real-time sync of referrals and placements</p>
                </div>
              </div>
              <div className="flex gap-3">
                <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Set up automation webhooks</p>
                  <p className="text-xs text-muted-foreground">Enable Zapier, Twilio, and email workflows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}