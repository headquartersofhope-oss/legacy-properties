import { useState } from "react";
import { base44 } from "@/api/base44Client";
import useCurrentUser from "@/lib/useCurrentUser";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import AccessDenied from "@/components/AccessDenied";

export default function PathwayIntegration() {
  const { isAdmin } = useCurrentUser();
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleExportData() {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('exportHousingData', {});
      setExportData(response.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadJSON() {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2)));
    element.setAttribute('download', `housing-export-${new Date().toISOString().split('T')[0]}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  if (!isAdmin) {
    return <AccessDenied message="Pathway integration management is restricted to admins." />;
  }

  return (
    <div>
      <PageHeader title="Pathway Integration" subtitle="Connect housing operations to the Pathway App" />

      <div className="space-y-6">
        {/* Integration Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Integration Ready</h3>
              <p className="text-sm text-muted-foreground mt-1">The housing app is structured and ready to connect with the Pathway App for referral tracking, bed availability, and placement management.</p>
            </div>
          </div>
        </div>

        {/* Data Structure Readiness */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Data Structure Readiness</h3>
          <div className="space-y-2">
            {[
              { label: 'Properties & House Inventory', ready: true },
              { label: 'Lease & Ownership Tracking', ready: true },
              { label: 'Bed Availability Status', ready: true },
              { label: 'Demographic Fit Logic', ready: true },
              { label: 'Referral Workflow', ready: true },
              { label: 'Application Pipeline', ready: true },
              { label: 'Occupancy Records', ready: true },
              { label: 'Document Linkage', ready: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                {item.ready ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-foreground">{item.label}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-muted-foreground">{item.label}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Export Housing Data */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="font-semibold text-foreground mb-3">Export Housing Data</h3>
          <p className="text-sm text-muted-foreground mb-4">Export clean, scoped housing data for Pathway integration or analysis.</p>
          <Button onClick={handleExportData} disabled={loading} className="w-full">
            {loading ? 'Exporting...' : 'Export Housing Data'}
          </Button>
        </div>

        {/* Export Preview */}
        {exportData && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-foreground">Export Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="w-4 h-4 mr-1" /> {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button size="sm" variant="outline" onClick={downloadJSON}>
                  <Download className="w-4 h-4 mr-1" /> Download
                </Button>
              </div>
            </div>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96 text-foreground">
              {JSON.stringify(exportData, null, 2)}
            </pre>
          </div>
        )}

        {/* Integration Notes */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
          <p className="font-medium mb-2">Integration Notes:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>The housing app is the operational source of truth</li>
            <li>Pathway App should consume housing data, not write back</li>
            <li>Use the exportHousingData function or API endpoint for data sync</li>
            <li>Partner/referral visibility is controlled via property flags</li>
            <li>All user roles are defined and mapped for both systems</li>
            <li>Set up server-side RLS rules in Base44 dashboard before connecting</li>
          </ul>
        </div>
      </div>
    </div>
  );
}