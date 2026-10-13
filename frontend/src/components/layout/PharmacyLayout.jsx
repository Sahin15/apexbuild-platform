import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Pill, Boxes, AlertTriangle, 
  Truck, Users, Receipt, BarChart3, Settings, Menu, X, Plus, Clock,
  User as UserIcon, HelpCircle, LogOut, Lock, Sparkles, ChevronRight,
  ShieldCheck, FileText, RotateCcw, SlidersHorizontal, Stethoscope, Search,
  Building2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { useBrandTheme } from '../../context/ThemeContext';
import Header from './Header';
import SidebarUserProfile from './SidebarUserProfile';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import PWAInstallBanner from '../common/PWAInstallBanner';
import OfflineStatusBanner from '../common/OfflineStatusBanner';
import NotificationPermissionBanner from '../common/NotificationPermissionBanner';
import PWAUpdatePrompt from '../common/PWAUpdatePrompt';

export default function PharmacyLayout() {
  const { user, logout } = useAuth();
  const { hasEntitlement, planName, tier } = useEntitlements();
  const { primaryColor } = useBrandTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Close menus on route change and scroll to top
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsFabOpen(false);
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setIsMoreMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  // Core operational modules (Counter & Fast Dispensing)
  const coreNavItems = [
    { 
      name: 'Dashboard', 
      path: '/pharmacy/dashboard', 
      icon: LayoutDashboard,
      status: 'active'
    },
    { 
      name: 'Counter POS Billing', 
      path: '/pharmacy/pos', 
      icon: ShoppingBag,
      status: 'active',
      badge: 'Terminal'
    },
  ];

  // Foundation & Management modules
  const managementNavItems = [
    { 
      name: 'Medicines Master', 
      path: '/pharmacy/medicines', 
      icon: Pill,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Batch Inventory', 
      path: '/pharmacy/inventory', 
      icon: Boxes,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Expiry & Debit Notes', 
      path: '/pharmacy/expiry', 
      icon: AlertTriangle,
      status: 'active',
      badge: 'Claims'
    },
    { 
      name: 'Purchases & GRN', 
      path: '/pharmacy/purchases', 
      icon: Truck,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Suppliers Directory', 
      path: '/pharmacy/suppliers', 
      icon: Building2,
      status: 'active'
    },
    { 
      name: 'Sales History', 
      path: '/pharmacy/sales', 
      icon: Receipt,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Returns & Refunds', 
      path: '/pharmacy/returns', 
      icon: RotateCcw,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Stock Adjustments', 
      path: '/pharmacy/adjustments', 
      icon: SlidersHorizontal,
      status: 'planned',
      tag: 'Phase 4'
    },
    { 
      name: 'Patient Directory & Khata', 
      path: '/pharmacy/customers', 
      icon: Users,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Operating Expenses', 
      path: '/pharmacy/expenses', 
      icon: Receipt,
      status: 'planned',
      tag: 'Phase 6'
    },
    { 
      name: 'Schedule H & GST Reports', 
      path: '/pharmacy/reports', 
      icon: BarChart3,
      status: 'planned',
      tag: 'Phase 7'
    },
    { 
      name: 'Staff & Pharmacists', 
      path: '/pharmacy/staff', 
      icon: ShieldCheck,
      status: 'planned',
      tag: 'Phase 8'
    },
  ];

  const effectivePrimary = primaryColor || '#0D9488';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Universal PWA, Offline & Notification Banners */}
      <OfflineStatusBanner />
      <PWAInstallBanner />
      <NotificationPermissionBanner />
      <PWAUpdatePrompt />

      {/* Desktop Sidebar (Fixed 64-width with dark medical teal/slate styling) */}
      <aside className="hidden md:flex flex-col w-64 bg-teal-950 border-r border-teal-900 fixed inset-y-0 z-20">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 border-b border-teal-900/80 shrink-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md transition-colors"
            style={{ 
              backgroundColor: effectivePrimary, 
              boxShadow: `0 4px 14px ${effectivePrimary}40` 
            }}
          >
            RX
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
              {user?.organizationId?.settings?.branding?.customAppName || user?.organizationId?.name || 'ApexBuild'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: effectivePrimary }}>
              Pharmacy OS
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-teal-900">
          <nav className="px-3 space-y-1">
            
            {/* Core Dispensing & Counter Section */}
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-teal-400">
              Counter Operations
            </div>
            {coreNavItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  style={active ? { backgroundColor: effectivePrimary } : {}}
                  className={`flex items-center px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                    active
                      ? 'text-white shadow-sm'
                      : 'text-teal-100/90 hover:bg-teal-900/60 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-teal-400 group-hover:text-teal-200'}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span 
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs ${
                        active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Medicine Logistics & Management Section */}
            <div className="pt-4 mt-4 border-t border-teal-900/60">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-teal-400">
                Pharmacy Management
              </div>
              {managementNavItems.map((item) => {
                const active = isActive(item.path);
                const isPlanned = item.status === 'planned';
                
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    style={active ? { backgroundColor: effectivePrimary } : {}}
                    className={`flex items-center px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                      active
                        ? 'text-white shadow-sm font-semibold'
                        : isPlanned
                          ? 'text-teal-300/60 hover:bg-teal-900/40 hover:text-teal-100'
                          : 'text-teal-100/90 hover:bg-teal-900/60 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-teal-400/80 group-hover:text-teal-200'}`} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span 
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs ${
                          active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.tag && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-teal-900/80 text-teal-300 border border-teal-800">
                        {item.tag}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

          </nav>
        </div>

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile customSubtitle="Retail Pharmacy" />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-24 md:pb-0 overscroll-contain">
        <Header setSidebarOpen={setIsMoreMenuOpen} />

        {/* Content Outlet */}
        <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for Quick POS Actions */}
      <div className="md:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end">
        {isFabOpen && (
          <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-4 duration-200">
            <button 
              onClick={() => { setIsFabOpen(false); navigate('/pharmacy/pos'); }} 
              className="flex items-center gap-3 group cursor-pointer"
            >
              <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                Counter POS Terminal
              </span>
              <div 
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg border border-teal-100 text-teal-700"
              >
                <ShoppingBag className="w-5 h-5" />
              </div>
            </button>
            <button 
              onClick={() => { setIsFabOpen(false); navigate('/pharmacy/medicines'); }} 
              className="flex items-center gap-3 group cursor-pointer"
            >
              <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                Search Medicines Master
              </span>
              <div 
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg border border-teal-100 text-teal-700"
              >
                <Pill className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          style={{ backgroundColor: effectivePrimary }}
          aria-label="Pharmacy Quick Actions"
          className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl text-white transition-transform duration-200 touch-manipulation cursor-pointer active:scale-95 ${isFabOpen ? 'rotate-45 brightness-90' : 'hover:brightness-110'}`}
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {isFabOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20" 
          onClick={() => setIsFabOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/pharmacy/dashboard"
            style={isActive('/pharmacy/dashboard') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/pharmacy/dashboard') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" strokeWidth={isActive('/pharmacy/dashboard') ? 2.5 : 2} />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            to="/pharmacy/pos"
            style={isActive('/pharmacy/pos') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/pharmacy/pos') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={isActive('/pharmacy/pos') ? 2.5 : 2} />
            <span className="text-[10px]">POS Bill</span>
          </Link>

          <Link
            to="/pharmacy/medicines"
            style={isActive('/pharmacy/medicines') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/pharmacy/medicines') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Pill className="h-5 w-5" strokeWidth={isActive('/pharmacy/medicines') ? 2.5 : 2} />
            <span className="text-[10px]">Medicines</span>
          </Link>

          <Link
            to="/pharmacy/inventory"
            style={isActive('/pharmacy/inventory') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/pharmacy/inventory') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Boxes className="h-5 w-5" strokeWidth={isActive('/pharmacy/inventory') ? 2.5 : 2} />
            <span className="text-[10px]">Batches</span>
          </Link>

          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation cursor-pointer ${
              isMoreMenuOpen ? 'text-teal-600 font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Menu Full Screen Drawer */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-50 flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
          <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs shadow-xs"
                style={{ backgroundColor: effectivePrimary }}
              >
                RX
              </div>
              <h2 className="text-base font-bold text-slate-900">Pharmacy OS Menu</h2>
            </div>
            <button 
              onClick={() => setIsMoreMenuOpen(false)}
              className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Card */}
            <div className="bg-white p-4 mb-2 border-b border-slate-100">
              <div className="flex items-center">
                <div 
                  className="h-11 w-11 rounded-full flex items-center justify-center text-white font-black text-base shadow-sm"
                  style={{ backgroundColor: effectivePrimary }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.name || 'Pharmacist'}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-teal-700">
                    {user?.role || 'Staff'} • {user?.organizationId?.name || 'Pharmacy Workspace'}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Links */}
            <div className="bg-white py-1 mb-2 border-y border-slate-100 divide-y divide-slate-100">
              {managementNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={`flex items-center justify-between px-5 py-3 text-xs font-medium transition-colors ${
                    isActive(item.path) ? 'text-teal-800 bg-teal-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.tag && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                      {item.tag}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Account & Support */}
            <div className="bg-white py-1 border-y border-slate-100">
              <Link
                to="/pharmacy/profile"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                Pharmacist Profile
              </Link>
              <Link
                to="/pharmacy/settings"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-4 w-4 mr-3 text-slate-400" />
                Store Settings & Drug Licence
              </Link>
              <Link
                to="/pharmacy/support"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <HelpCircle className="h-4 w-4 mr-3 text-slate-400" />
                Help & Pharmacy Support
              </Link>
              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center px-5 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-3 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Logout Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}

function Building2Icon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
      <path d="M10 6h4"/>
      <path d="M10 10h4"/>
      <path d="M10 14h4"/>
      <path d="M10 18h4"/>
    </svg>
  );
}
