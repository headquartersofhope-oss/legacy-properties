import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import useCurrentUser from '@/lib/useCurrentUser';
import PageHeader from '@/components/PageHeader';
import AccessDenied from '@/components/AccessDenied';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export default function HousingModels() {
  const { isAdmin, isManager, isInternal } = useCurrentUser();
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isInternal) return <AccessDenied message="Only internal staff can access housing model management." />;

  async function runAudit() {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('auditHousingBusinessModels', {});
      setAuditData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to run audit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Housing Business Models" 
        subtitle="Manage per-bed and turnkey house models"
      >
        <Button onClick={runAudit} disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Run Model Audit
        </Button>
      </PageHeader>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {auditData && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditData.summary.total_properties}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Per-Bed Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{auditData.summary.per_bed_properties}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Turnkey Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{auditData.summary.turnkey_properties}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Per-Bed Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{auditData.summary.per_bed_utilization_percent}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Bed Inventory */}
          {auditData.summary.total_bed_inventory > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-Bed Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Beds</p>
                    <p className="text-2xl font-bold">{auditData.summary.total_bed_inventory}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Occupied</p>
                    <p className="text-2xl font-bold text-amber-600">{auditData.summary.per_bed_occupied}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-2xl font-bold text-green-600">{auditData.summary.per_bed_available}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Critical Issues */}
          {auditData.critical_issues.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  Critical Issues ({auditData.critical_issues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {auditData.critical_issues.map((issue, i) => (
                    <li key={i} className="text-sm text-destructive flex gap-2">
                      <span className="text-lg">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {auditData.warnings.length > 0 && (
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-amber-600" />
                  Warnings ({auditData.warnings.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {auditData.warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-amber-800 flex gap-2">
                      <span className="text-lg">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Per-Bed Properties */}
          {auditData.per_bed_properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-Bed Properties ({auditData.per_bed_properties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.per_bed_properties.map(prop => (
                    <div key={prop.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{prop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {prop.beds} beds • {prop.residents} residents • {prop.available} available
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Per-Bed</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Turnkey Properties */}
          {auditData.turnkey_properties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Turnkey Properties ({auditData.turnkey_properties.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditData.turnkey_properties.map(prop => (
                    <div key={prop.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{prop.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Client: {prop.client_name || 'Unassigned'} • {prop.beds} beds • {prop.residents} residents
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Turnkey</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {auditData.recommendations.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {auditData.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-green-800 flex gap-2">
                      <span className="text-lg">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Readiness Summary */}
          {auditData.housing_model_readiness && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integration Readiness</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Per-Bed Model Ready</span>
                  <Badge variant={auditData.housing_model_readiness.per_bed_ready ? 'default' : 'secondary'}>
                    {auditData.housing_model_readiness.per_bed_ready ? '✓ Ready' : 'Needs Work'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Turnkey Model Ready</span>
                  <Badge variant={auditData.housing_model_readiness.turnkey_ready ? 'default' : 'secondary'}>
                    {auditData.housing_model_readiness.turnkey_ready ? '✓ Ready' : 'Needs Work'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pathway Integration</span>
                  <Badge variant="outline" className="bg-blue-50">{auditData.housing_model_readiness.pathway_clarity}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}