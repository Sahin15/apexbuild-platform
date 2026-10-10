import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, 
  Receipt, CreditCard, Wallet, Building2, LineChart, 
  Settings, Calculator, Menu, Bell, Plus, X, LogOut, ChevronRight, ChevronUp, User as UserIcon, HelpCircle,
  UsersRound, Truck as TruckIcon, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { useBrandTheme } from '../../context/ThemeContext';
import Header from './Header';
import SidebarUserProfile from './SidebarUserProfile';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import PWAInstallBanner from '../common/PWAInstallBanner';
import OfflineStatusBanner from '../common/OfflineStatusBanner';

const navItems = [
  { name: 'Dashboard', href: '/distributor/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Sales/Deliveries', href: '/distributor/deliveries', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Customers', href: '/distributor/customers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/distributor/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Pre-Orders', href: '/distributor/estimations', icon: Calculator, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'], feature: 'preOrderEstimations', tier: 'PRO' },
  { name: 'Purchases', href: '/distributor/purchases', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Stock Ledger', href: '/distributor/stock', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'], feature: 'multiDepotStock', tier: 'ENT' },
  { name: 'Expenses', href: '/distributor/expenses', icon: Wallet, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'DRIVER'] },
  { name: 'Suppliers', href: '/distributor/suppliers', icon: Building2, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Reports', href: '/distributor/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'], feature: 'financialVariancePnL', tier: 'ENT' },
  { name: 'Team', href: '/distributor/team', icon: UsersRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Vehicles', href: '/distributor/vehicles', icon: TruckIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'], feature: 'driverMobileApp', tier: 'PRO' },
  { name: 'Driver App', href: '/distributor/driver', icon: TruckIcon, roles: ['DRIVER'], feature: 'driverMobileApp', tier: 'PRO' },
];

const bottomNavItems = [
  { name: 'Home', href: '/distributor/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Deliveries', href: '/distributor/deliveries', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Customers', href: '/distributor/customers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/distributor/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Driver App', href: '/distributor/driver', icon: Truck, roles: ['DRIVER'] }
];

const secondaryNavItems = [
  { name: 'Pre-Orders', href: '/distributor/estimations', icon: Calculator, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Purchases', href: '/distributor/purchases', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Stock Ledger', href: '/distributor/stock', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Expenses', href: '/distributor/expenses', icon: Wallet, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'DRIVER'] },
  { name: 'Suppliers', href: '/distributor/suppliers', icon: Building2, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Reports', href: '/distributor/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Team', href: '/distributor/team', icon: UsersRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Vehicles', href: '/distributor/vehicles', icon: TruckIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'My Profile', href: '/distributor/profile', icon: UserIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'DRIVER'] },
  { name: 'Settings', href: '/distributor/settings', icon: Settings, roles: ['OWNER', 'ADMIN', 'MANAGER'] }
];

export default function DistributorLayout() {
  const { user, logout } = useAuth();
  const { hasEntitlement } = useEntitlements();
  const { primaryColor } = useBrandTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);
  const topMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
      if (topMenuRef.current && !topMenuRef.current.contains(event.target)) {
        setTopMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDrawerOpen(false);
    setMenuOpen(false);
    setTopMenuOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/deliveries')) return 'Deliveries';
    if (path.includes('/customers')) return 'Customers';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/purchases')) return 'Purchases';
    if (path.includes('/stock')) return 'Stock Ledger';
    if (path.includes('/expenses')) return 'Expenses';
    if (path.includes('/suppliers')) return 'Suppliers';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/estimations')) return 'Pre-Orders';
    return 'ApexSupply';
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden w-full relative">
      {/* Universal Offline Status Indicator */}
      <OfflineStatusBanner />

      {/* Universal PWA Mobile Install Banner */}
      <PWAInstallBanner />

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 flex-shrink-0 z-30">
        <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 border-b border-slate-800 shrink-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md transition-colors"
            style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}40` }}
          >
            DT
          </div>
          <div className="flex flex-col">
            <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
              {user?.organizationId?.settings?.branding?.customAppName || 'ApexBuild'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: primaryColor }}>
              Distributor OS
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="mb-6 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            <div className="space-y-1">
              {navItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
                const isLocked = item.feature && !hasEntitlement(item.feature);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    style={({ isActive }) => (isActive ? { backgroundColor: primaryColor } : {})}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'text-white shadow-sm font-semibold' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <item.icon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isLocked && (
                      <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        {item.tier || 'PRO'}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 relative w-full">
        {/* Unified Top Navbar */}
        <Header setSidebarOpen={setIsDrawerOpen} />

        {/* Dynamic Page Content with Safe Area Bottom Padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pb-28 md:pb-8 md:p-8 overscroll-contain">
          <Outlet />
        </main>

        {/* Global FAB (Mobile Only) */}
        <div className="md:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end">
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-4 duration-200">
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/purchases'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">Add Purchase</span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-600 border border-amber-100">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </button>
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/deliveries'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">Add Delivery</span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-600 border border-amber-100">
                  <Truck className="w-5 h-5" />
                </div>
              </button>
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/payments'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">Add Payment</span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-600 border border-amber-100">
                  <CreditCard className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            style={{ backgroundColor: primaryColor || '#d97706' }}
            aria-label="Quick Actions"
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl text-white transition-transform duration-200 touch-manipulation active:scale-95 ${isFabOpen ? 'rotate-45 brightness-90' : 'hover:brightness-110'}`}
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

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around h-16 z-40 flex-shrink-0 pb-safe fixed bottom-0 left-0 w-full shadow-lg">
          {bottomNavItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
            const isActive = location.pathname.includes(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                style={isActive ? { color: primaryColor || '#d97706' } : {}}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-manipulation ${
                  isActive ? 'font-bold' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} style={isActive ? { color: primaryColor || '#d97706' } : {}} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
          
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-800 touch-manipulation"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </nav>

        {/* Mobile Drawer (Bottom Sheet) - Mobile Only */}
        {isDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 pb-safe">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900">Distributor Navigation</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">{user?.organizationId?.name || 'Poultry Operations'}</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 touch-manipulation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1 overscroll-contain">
                <div className="grid grid-cols-1 gap-2">
                  {secondaryNavItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
                    const isActive = location.pathname.includes(item.href);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl transition-all touch-manipulation ${
                          isActive 
                            ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs' 
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ 
                              backgroundColor: isActive ? `${primaryColor}20` : '#f1f5f9',
                              color: isActive ? (primaryColor || '#d97706') : '#64748b'
                            }}
                          >
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-sm">{item.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </NavLink>
                    );
                  })}
                </div>

                <div className="mt-6 mb-4">
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors border border-rose-100 text-sm touch-manipulation"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
