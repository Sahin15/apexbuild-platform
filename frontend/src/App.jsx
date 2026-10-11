import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EntitlementProvider } from './context/EntitlementContext';
import { onForegroundMessage } from './services/firebase';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Clients from './pages/Clients';
import BOQ from './pages/BOQ';
import SiteReports from './pages/SiteReports';
import Labour from './pages/Labour';
import Materials from './pages/Materials';
import Expenses from './pages/Expenses';
import Measurements from './pages/Measurements';
import Billing from './pages/Billing';
import Documents from './pages/Documents';
import Team from './pages/Team';
import Reports from './pages/Reports';
import ProjectCashFlow from './pages/ProjectCashFlow';
import Equipment from './pages/Equipment';
import Snags from './pages/Snags';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import HelpSupport from './pages/HelpSupport';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import SupplierLayout from './components/layout/SupplierLayout';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import SupplierCustomers from './pages/supplier/SupplierCustomers';
import SupplierProducts from './pages/supplier/SupplierProducts';
import SupplierInventory from './pages/supplier/SupplierInventory';
import SupplierPurchases from './pages/supplier/SupplierPurchases';
import SupplierOrders from './pages/supplier/SupplierOrders';
import SupplierDeliveries from './pages/supplier/SupplierDeliveries';
import SupplierVendors from './pages/supplier/SupplierVendors';
import SupplierInvoices from './pages/supplier/SupplierInvoices';
import SupplierPayments from './pages/supplier/SupplierPayments';
import SupplierExpenses from './pages/supplier/SupplierExpenses';
import SupplierQuotations from './pages/supplier/SupplierQuotations';
import SupplierReports from './pages/supplier/SupplierReports';
import SupplierDocuments from './pages/supplier/SupplierDocuments';
import SupplierTeam from './pages/supplier/SupplierTeam';
import SuperadminDashboard from './pages/superadmin/SuperadminDashboard';
import SuperAdminLayout from './components/layout/SuperAdminLayout';
import SABusinessAccounts from './pages/superadmin/SABusinessAccounts';
import SABusinessAccountDetails from './pages/superadmin/SABusinessAccountDetails';
import SASubscriptions from './pages/superadmin/SASubscriptions';
import SAUsage from './pages/superadmin/SAUsage';
import SAOSProducts from './pages/superadmin/SAOSProducts';
import SAOSPlans from './pages/superadmin/SAOSPlans';
import SAInvoices from './pages/superadmin/SAInvoices';
import SAPayments from './pages/superadmin/SAPayments';
import SAImplementationFees from './pages/superadmin/SAImplementationFees';
import SARevenue from './pages/superadmin/SARevenue';
import SADeepAnalytics from './pages/superadmin/SADeepAnalytics';
import SAOSPerformance from './pages/superadmin/SAOSPerformance';
import SACMSPages from './pages/superadmin/SACMSPages';
import SABlog from './pages/superadmin/SABlog';
import SAMedia from './pages/superadmin/SAMedia';
import SAMenus from './pages/superadmin/SAMenus';
import SABanners from './pages/superadmin/SABanners';
import SALandingPages from './pages/superadmin/SALandingPages';
import SASEO from './pages/superadmin/SASEO';
import SATeamMembers from './pages/superadmin/SATeamMembers';
import SAAuditLogs from './pages/superadmin/SAAuditLogs';
import SASettings from './pages/superadmin/SASettings';
import SAMasterData from './pages/superadmin/SAMasterData';
import SASupportDesk from './pages/superadmin/SASupportDesk';
import SANotifications from './pages/superadmin/SANotifications';
import SAPartners from './pages/superadmin/SAPartners';
import SARenewals from './pages/superadmin/SARenewals';
import MasqueradeBar from './components/layout/MasqueradeBar';
import DistributorLayout from './components/layout/DistributorLayout';
import DistributorDashboard from './pages/distributor/DistributorDashboard';
import DistributorCustomers from './pages/distributor/DistributorCustomers';
import DistributorCustomerDetails from './pages/distributor/DistributorCustomerDetails';
import DistributorSuppliers from './pages/distributor/DistributorSuppliers';
import DistributorPurchases from './pages/distributor/DistributorPurchases';
import DistributorSales from './pages/distributor/DistributorSales';
import DistributorStock from './pages/distributor/DistributorStock';
import DistributorExpenses from './pages/distributor/DistributorExpenses';
import DistributorPayments from './pages/distributor/DistributorPayments';
import DistributorEstimations from './pages/distributor/DistributorEstimations';
import DistributorReports from './pages/distributor/DistributorReports';
import DistributorTeam from './pages/distributor/DistributorTeam';
import DistributorTeamProfile from './pages/distributor/DistributorTeamProfile';
import DistributorVehicles from './pages/distributor/DistributorVehicles';
import DistributorVehicleHistory from './pages/distributor/DistributorVehicleHistory';
import DistributorDriver from './pages/distributor/DistributorDriver';
import DistributorProfile from './pages/distributor/DistributorProfile';
import Landing from './pages/Landing';
import Register from './pages/Register';

// Diagnostics
import DiagnosticsLayout from './components/layout/DiagnosticsLayout';
import DiagnosticsDashboard from './pages/diagnostics/DiagnosticsDashboard';
import DiagnosticsPatients from './pages/diagnostics/DiagnosticsPatients';
import DiagnosticsPatientDetails from './pages/diagnostics/DiagnosticsPatientDetails';
import DiagnosticsTests from './pages/diagnostics/DiagnosticsTests';
import DiagnosticsDoctors from './pages/diagnostics/DiagnosticsDoctors';
import DiagnosticsOrders from './pages/diagnostics/DiagnosticsOrders';
import DiagnosticsSamples from './pages/diagnostics/DiagnosticsSamples';
import DiagnosticsResults from './pages/diagnostics/DiagnosticsResults';
import DiagnosticsReports from './pages/diagnostics/DiagnosticsReports';
import DiagnosticsInventory from './pages/diagnostics/DiagnosticsInventory';
import DiagnosticsSettings from './pages/diagnostics/DiagnosticsSettings';
import DiagnosticsPayments from './pages/diagnostics/DiagnosticsPayments';
import DiagnosticsQC from './pages/diagnostics/DiagnosticsQC';
import PlatformBilling from './pages/PlatformBilling';

const ProtectedRoute = ({ children, allowedBusinessTypes }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const businessType = user?.organizationId?.businessType || 'CONTRACTOR';
  
  if (allowedBusinessTypes && !allowedBusinessTypes.includes(businessType)) {
    if (businessType === 'MATERIAL_SUPPLIER') return <Navigate to="/supplier/dashboard" replace />;
    if (businessType === 'CHICKEN_DISTRIBUTOR') return <Navigate to="/distributor/dashboard" replace />;
    if (businessType === 'DIAGNOSTICS') return <Navigate to="/diagnostics/dashboard" replace />;
    if (businessType === 'SUPERADMIN') return <Navigate to="/superadmin/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const DistributorIndex = () => {
  const { user } = useAuth();
  if (user?.role === 'DRIVER') return <Navigate to="/distributor/driver" replace />;
  return <Navigate to="/distributor/dashboard" replace />;
};

const DiagnosticsIndex = () => {
  const { user } = useAuth();
  // We can add role-based redirects here later if needed
  return <Navigate to="/diagnostics/dashboard" replace />;
};

const FcmForegroundListener = () => {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'SUPERADMIN' || user?.organizationId?.businessType === 'SUPERADMIN';

  useEffect(() => {
    if (!user || isSuperadmin) return;

    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'ApexBuild Alert';
      const body = payload.notification?.body || payload.data?.body || '';

      toast(
        (t) => (
          <div className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">🔥</span>
            <div>
              <p className="font-bold text-xs text-slate-900 leading-snug">{title}</p>
              {body && <p className="text-xs text-slate-600 mt-0.5 leading-snug">{body}</p>}
            </div>
          </div>
        ),
        { duration: 5000, position: 'top-right' }
      );
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user, isSuperadmin]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <EntitlementProvider>
        <Toaster position="top-right" />
        <FcmForegroundListener />
        <MasqueradeBar />
        <Router>
          <ThemeProvider>
            <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes for CONTRACTORS wrapped in Layout */}
          <Route element={
            <ProtectedRoute allowedBusinessTypes={['CONTRACTOR']}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/:id/*" element={<ProjectDetails />} />
            <Route path="clients" element={<Clients />} />
            <Route path="boq" element={<BOQ />} />
            <Route path="site-reports" element={<SiteReports />} />
            <Route path="snags" element={<Snags />} />
            <Route path="labour" element={<Labour />} />
            <Route path="materials" element={<Materials />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="measurements" element={<Measurements />} />
            <Route path="billing" element={<Billing />} />
            <Route path="cashflow" element={<ProjectCashFlow />} />
            <Route path="documents" element={<Documents />} />
            <Route path="team" element={<Team />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscription" element={<PlatformBilling />} />
            <Route path="support" element={<HelpSupport />} />
          </Route>

          {/* Protected Routes for MATERIAL SUPPLIER wrapped in SupplierLayout */}
          <Route path="/supplier" element={
            <ProtectedRoute allowedBusinessTypes={['MATERIAL_SUPPLIER']}>
              <SupplierLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/supplier/dashboard" replace />} />
            <Route path="dashboard" element={<SupplierDashboard />} />
            <Route path="customers" element={<SupplierCustomers />} />
            <Route path="products" element={<SupplierProducts />} />
            <Route path="inventory" element={<SupplierInventory />} />
            <Route path="purchases" element={<SupplierPurchases />} />
            <Route path="suppliers" element={<SupplierVendors />} />
            <Route path="quotations" element={<SupplierQuotations />} />
            <Route path="orders" element={<SupplierOrders />} />
            <Route path="deliveries" element={<SupplierDeliveries />} />
            <Route path="invoices" element={<SupplierInvoices />} />
            <Route path="payments" element={<SupplierPayments />} />
            <Route path="expenses" element={<SupplierExpenses />} />
            <Route path="reports" element={<SupplierReports />} />
            <Route path="documents" element={<SupplierDocuments />} />
            <Route path="team" element={<SupplierTeam />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="subscription" element={<PlatformBilling />} />
            <Route path="support" element={<HelpSupport />} />
          </Route>

          {/* Protected Routes for SUPERADMIN */}
          <Route path="/superadmin" element={
            <ProtectedRoute allowedBusinessTypes={['SUPERADMIN']}>
              <SuperAdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
            <Route path="dashboard" element={<SuperadminDashboard />} />
            <Route path="business-accounts" element={<SABusinessAccounts />} />
            <Route path="business-accounts/:id" element={<SABusinessAccountDetails />} />
            <Route path="team-members" element={<SATeamMembers />} />
            <Route path="master-data" element={<SAMasterData />} />
            <Route path="os-products" element={<SAOSProducts />} />
            <Route path="plans" element={<SAOSPlans />} />
            <Route path="subscriptions" element={<SASubscriptions />} />
            <Route path="renewals" element={<SARenewals />} />
            <Route path="usage" element={<SAUsage />} />
            <Route path="invoices" element={<SAInvoices />} />
            <Route path="implementation-fees" element={<SAImplementationFees />} />
            <Route path="payments" element={<SAPayments />} />
            <Route path="reports/revenue" element={<SARevenue />} />
            <Route path="reports/analytics" element={<SADeepAnalytics />} />
            <Route path="reports/os" element={<SAOSPerformance />} />
            <Route path="support" element={<SASupportDesk />} />
            <Route path="notifications" element={<SANotifications />} />
            <Route path="partners" element={<SAPartners />} />
            <Route path="cms/pages" element={<SACMSPages />} />
            <Route path="cms/blog" element={<SABlog />} />
            <Route path="cms/media" element={<SAMedia />} />
            <Route path="cms/landing" element={<SALandingPages />} />
            <Route path="cms/menus" element={<SAMenus />} />
            <Route path="cms/banners" element={<SABanners />} />
            <Route path="cms/seo" element={<SASEO />} />
            <Route path="audit-logs" element={<SAAuditLogs />} />
            <Route path="settings" element={<SASettings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Protected Routes for CHICKEN DISTRIBUTOR */}
          <Route path="/distributor" element={
            <ProtectedRoute allowedBusinessTypes={['CHICKEN_DISTRIBUTOR']}>
              <DistributorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DistributorIndex />} />
            <Route path="dashboard" element={<DistributorDashboard />} />
            <Route path="customers" element={<DistributorCustomers />} />
            <Route path="customers/:id" element={<DistributorCustomerDetails />} />
            <Route path="estimations" element={<DistributorEstimations />} />
            <Route path="suppliers" element={<DistributorSuppliers />} />
            <Route path="purchases" element={<DistributorPurchases />} />
            <Route path="stock" element={<DistributorStock />} />
            <Route path="sales" element={<DistributorSales />} />
            <Route path="deliveries" element={<DistributorSales />} />
            <Route path="expenses" element={<DistributorExpenses />} />
            <Route path="payments" element={<DistributorPayments />} />
            <Route path="reports" element={<DistributorReports />} />
            <Route path="team" element={<DistributorTeam />} />
            <Route path="team/:id/profile" element={<DistributorTeamProfile />} />
            <Route path="vehicles" element={<DistributorVehicles />} />
            <Route path="vehicles/:id/history" element={<DistributorVehicleHistory />} />
            <Route path="driver" element={<DistributorDriver />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<PlatformBilling />} />
            <Route path="support" element={<HelpSupport />} />
          </Route>

          {/* Protected Routes for DIAGNOSTICS */}
          <Route path="/diagnostics" element={
            <ProtectedRoute allowedBusinessTypes={['DIAGNOSTICS']}>
              <DiagnosticsLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DiagnosticsIndex />} />
            <Route path="dashboard" element={<DiagnosticsDashboard />} />
            <Route path="patients" element={<DiagnosticsPatients />} />
            <Route path="patients/:id" element={<DiagnosticsPatientDetails />} />
            <Route path="orders" element={<DiagnosticsOrders />} />
            <Route path="samples" element={<DiagnosticsSamples />} />
            <Route path="results" element={<DiagnosticsResults />} />
            <Route path="reports" element={<DiagnosticsReports />} />
            <Route path="inventory" element={<DiagnosticsInventory />} />
            <Route path="settings" element={<DiagnosticsSettings />} />
            <Route path="payments" element={<DiagnosticsPayments />} />
            <Route path="tests" element={<DiagnosticsTests />} />
            <Route path="doctors" element={<DiagnosticsDoctors />} />
            <Route path="qc" element={<DiagnosticsQC />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="subscription" element={<PlatformBilling />} />
            <Route path="support" element={<HelpSupport />} />
          </Route>

          <Route path="*" element={<NotFound />} />
            </Routes>
          </ThemeProvider>
        </Router>
      </EntitlementProvider>
    </AuthProvider>
  );
}

export default App;
