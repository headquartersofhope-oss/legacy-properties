import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import useCurrentUser from "@/lib/useCurrentUser";
import {
  Home, Building2, DoorOpen, BedDouble, FileText, Users, UserCheck,
  ClipboardList, FolderOpen, AlertTriangle, ShieldCheck, DollarSign,
  Building, BarChart3, Settings, Menu, X, LogOut, ChevronRight, Zap, Grid3X3
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

const internalNav = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "Properties", path: "/properties", icon: Building2 },
  { label: "Leases", path: "/leases", icon: FileText },
  { label: "Sites / Houses", path: "/sites", icon: Building2 },
  { label: "Rooms", path: "/rooms", icon: DoorOpen },
  { label: "Beds", path: "/beds", icon: BedDouble },
  { label: "Referrals", path: "/referrals", icon: FileText },
  { label: "Applicants", path: "/applicants", icon: Users },
  { label: "Residents", path: "/residents", icon: UserCheck },
  { label: "Occupancy", path: "/occupancy", icon: ClipboardList },
  { label: "Documents", path: "/documents", icon: FolderOpen },
  { label: "Incidents", path: "/incidents", icon: AlertTriangle },
  { label: "Compliance", path: "/compliance", icon: ShieldCheck },
  { label: "Fees / Charges", path: "/fees", icon: DollarSign },
  { label: "Referring Orgs", path: "/referring-orgs", icon: Building },
  { label: "Reporting", path: "/reporting", icon: BarChart3 },
  { label: "Housing Models", path: "/housing-models", icon: Grid3X3 },
  { label: "Diagnostics", path: "/diagnostics", icon: Settings },
  { label: "Integration Readiness", path: "/integration-readiness", icon: Zap },
  { label: "Settings", path: "/settings", icon: Settings },
];

const partnerNav = [
  { label: "Dashboard", path: "/", icon: Home },
  { label: "My Referrals", path: "/referrals", icon: FileText },
  { label: "Availability", path: "/availability", icon: BedDouble },
];

export default function Layout() {
  const { user, loading, isInternal, isPartner } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Security: only show nav items the user's role is entitled to.
  // Unknown / unauthenticated roles get an empty nav.
  const filteredNav = isPartner ? partnerNav : (isInternal ? internalNav : []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Building2 className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-accent-foreground">Housing Ops</h1>
            <p className="text-[11px] text-sidebar-foreground/60">{isPartner ? 'Partner Portal' : 'Operations'}</p>
          </div>
          <button className="lg:hidden ml-auto" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {filteredNav.map(item => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'}`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center text-[11px] font-semibold text-sidebar-accent-foreground">
              {user?.full_name?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">{user?.full_name || 'User'}</p>
              <p className="text-[10px] text-sidebar-foreground/50 capitalize">{user?.role?.replace(/_/g, ' ') || 'User'}</p>
            </div>
            <button onClick={() => base44.auth.logout()} className="text-sidebar-foreground/40 hover:text-sidebar-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold">Housing Ops</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}