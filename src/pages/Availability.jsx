import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import { Building2, BedDouble } from "lucide-react";

export default function Availability() {
  const [sites, setSites] = useState([]);
  const [beds, setBeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const [s, b] = await Promise.all([
      base44.entities.HousingSite.filter({ status: 'active' }),
      base44.entities.Bed.filter({ status: 'active' }),
    ]);
    setSites(s);
    setBeds(b);
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-6 h-6 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  const siteSummaries = sites.map(site => {
    const siteBeds = beds.filter(b => b.site_id === site.id);
    const available = siteBeds.filter(b => b.bed_status === 'available').length;
    const total = siteBeds.length;
    return { ...site, available, total };
  });

  const totalAvailable = beds.filter(b => b.bed_status === 'available').length;
  const totalBeds = beds.length;

  return (
    <div>
      <PageHeader title="Bed Availability" subtitle="General availability summary for referring partners" />

      <div className="bg-card border border-border rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <BedDouble className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-bold text-foreground">{totalAvailable}</p>
            <p className="text-sm text-muted-foreground">beds available out of {totalBeds} total</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {siteSummaries.map(site => (
          <div key={site.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">{site.site_name}</h3>
                <p className="text-xs text-muted-foreground">{site.city}{site.state ? `, ${site.state}` : ''}</p>
                <div className="flex items-center gap-2 mt-2">
                  <StatusBadge status={site.site_type} />
                  {site.gender_restriction && site.gender_restriction !== 'none' && (
                    <StatusBadge status={site.gender_restriction} />
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">{site.available}</span>
                  <span className="text-xs text-muted-foreground">/ {site.total} beds available</span>
                </div>
                {site.available === 0 && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">Waitlist may be available</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {siteSummaries.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">No active sites found.</div>
      )}
    </div>
  );
}