import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import Rooms from './pages/Rooms.jsx';
import Beds from './pages/Beds.jsx';
import Referrals from './pages/Referrals';
import Applicants from './pages/Applicants';
import Residents from './pages/Residents';
import Occupancy from './pages/Occupancy';
import Documents from './pages/Documents';
import Incidents from './pages/Incidents';
import Compliance from './pages/Compliance';
import Fees from './pages/Fees';
import ReferringOrgs from './pages/ReferringOrgs';
import Reporting from './pages/Reporting';
import Availability from './pages/Availability';
import Settings from './pages/Settings';
import Properties from './pages/Properties';
import PropertyDetail from './pages/PropertyDetail';
import MoveRequests from './pages/MoveRequests';
import Leases from './pages/Leases';
import BedSearch from './pages/BedSearch';
import Diagnostics from './pages/Diagnostics';
import IntegrationReadiness from './pages/IntegrationReadiness';
import HousingModels from './pages/HousingModels';
import PathwayIntegration from './pages/PathwayIntegration';
import OperationalAudit from './pages/OperationalAudit';
import TurnkeyDashboard from './pages/TurnkeyDashboard';
import Billing from './pages/Billing';
import CreateInvoice from './pages/CreateInvoice';
import RecurringRules from './pages/RecurringRules';
import MaintenanceRequests from './pages/MaintenanceRequests';
import LeaseManagement from './pages/LeaseManagement';
import TenantPortal from './pages/TenantPortal';
import CRMPipeline from './pages/CRMPipeline';
import ShowingScheduler from './pages/ShowingScheduler';
import PLDashboard from './pages/PLDashboard';
import HouseExpenses from './pages/HouseExpenses';
import PartnerPortal from './pages/PartnerPortal';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1628' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid rgba(212,175,55,0.2)', borderTopColor: '#d4af37', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94a3b8', fontSize: 13 }}>Loading REJG Legacy Properties...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') return <UserNotRegisteredError />;
    if (authError.type === 'auth_required') { navigateToLogin(); return null; }
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/beds" element={<Beds />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/applicants" element={<Applicants />} />
        <Route path="/residents" element={<Residents />} />
        <Route path="/occupancy" element={<Occupancy />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/referring-orgs" element={<ReferringOrgs />} />
        <Route path="/reporting" element={<Reporting />} />
        <Route path="/availability" element={<Availability />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/property/:id" element={<PropertyDetail />} />
        <Route path="/move-requests" element={<MoveRequests />} />
        <Route path="/leases" element={<Leases />} />
        <Route path="/bed-search" element={<BedSearch />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/integration-readiness" element={<IntegrationReadiness />} />
        <Route path="/housing-models" element={<HousingModels />} />
        <Route path="/pathway-integration" element={<PathwayIntegration />} />
        <Route path="/operational-audit" element={<OperationalAudit />} />
        <Route path="/turnkey" element={<TurnkeyDashboard />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/create" element={<CreateInvoice />} />
        <Route path="/recurring-rules" element={<RecurringRules />} />
        <Route path="/maintenance" element={<MaintenanceRequests />} />
        <Route path="/lease-management" element={<LeaseManagement />} />
        <Route path="/tenant-portal" element={<TenantPortal />} />
        <Route path="/crm" element={<CRMPipeline />} />
        <Route path="/showings" element={<ShowingScheduler />} />
        <Route path="/pl-dashboard" element={<PLDashboard />} />
        <Route path="/house-expenses" element={<HouseExpenses />} />
        <Route path="/partner-portal" element={<PartnerPortal />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App