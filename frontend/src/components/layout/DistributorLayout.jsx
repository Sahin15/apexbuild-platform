import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, Truck, 
  Receipt, CreditCard, Wallet, Building2, LineChart, 
  Settings, Calculator, Menu, Bell, Plus, X, LogOut, ChevronRight, ChevronUp, User as UserIcon, HelpCircle,
  UsersRound, Truck as TruckIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import SidebarUserProfile from './SidebarUserProfile';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

const navItems = [
  { name: 'Dashboard', href: '/distributor/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Sales/Deliveries', href: '/distributor/deliveries', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Customers', href: '/distributor/customers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/distributor/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Pre-Orders', href: '/distributor/estimations', icon: Calculator, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Purchases', href: '/distributor/purchases', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF'] },
  { name: 'Stock Ledger', href: '/distributor/stock', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'ACCOUNTANT'] },
  { name: 'Expenses', href: '/distributor/expenses', icon: Wallet, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT', 'STAFF', 'DRIVER'] },
  { name: 'Suppliers', href: '/distributor/suppliers', icon: Building2, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Reports', href: '/distributor/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Team', href: '/distributor/team', icon: UsersRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Vehicles', href: '/distributor/vehicles', icon: TruckIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'Driver App', href: '/distributor/driver', icon: TruckIcon, roles: ['DRIVER'] },
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
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
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

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      {/* Offline Banner */}
      {isOffline && (
        <div className="absolute top-0 left-0 right-0 z-[200] bg-red-500 text-white text-xs font-bold py-1.5 px-4 flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-3.5 h-3.5" /> You are currently offline. Changes may not be saved.
        </div>
      )}
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 transition-all duration-300 flex-shrink-0 z-30">
        <div className="h-16 flex items-center gap-3 px-6 bg-slate-950 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-amber-600/30">
            DT
          </div>
          <div className="flex flex-col">
            <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
              {user?.organizationId?.settings?.branding?.customAppName || 'ApexBuild'}
            </span>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mt-0.5">Distributor OS</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="mb-6 px-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
            <div className="space-y-1">
              {navItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
                const isActive = location.pathname.includes(item.href);
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-emerald-600 text-white shadow-sm' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <item.icon className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                    {item.name}
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

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative pb-20 md:pb-8 md:p-8">
          <Outlet />
        </main>

        {/* Global FAB (Mobile Only) */}
        <div className="md:hidden absolute bottom-20 right-4 z-30 flex flex-col items-end">
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-4 duration-200">
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/purchases'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold shadow-md text-slate-700">Add Purchase</span>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </button>
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/deliveries'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold shadow-md text-slate-700">Add Delivery</span>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-indigo-600">
                  <Truck className="w-5 h-5" />
                </div>
              </button>
              <button onClick={() => { setIsFabOpen(false); navigate('/distributor/payments'); }} className="flex items-center gap-3 group">
                <span className="bg-white px-3 py-1 rounded-lg text-sm font-bold shadow-md text-slate-700">Add Payment</span>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-amber-600">
                  <CreditCard className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg text-white transition-transform duration-200 ${isFabOpen ? 'bg-slate-800 rotate-45' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {isFabOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-20" 
            onClick={() => setIsFabOpen(false)}
          />
        )}

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden bg-white border-t border-slate-200 flex items-center justify-around h-16 z-40 flex-shrink-0 pb-safe absolute bottom-0 left-0 w-full">
          {bottomNavItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
            const isActive = location.pathname.includes(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-emerald-50 text-emerald-600' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {item.name}
                </span>
              </NavLink>
            );
          })}
          
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-6 h-6" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </nav>

        {/* Mobile Drawer (Bottom Sheet) - Mobile Only */}
        {isDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-800">Menu</span>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{user?.organizationId?.name}</span>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="overflow-y-auto p-4 flex-1">
                <div className="grid grid-cols-1 gap-2">
                  {secondaryNavItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
                    const isActive = location.pathname.includes(item.href);
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-base">{item.name}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300" />
                      </NavLink>
                    );
                  })}
                </div>

                <div className="mt-8 mb-8">
                  <button 
                    onClick={handleLogoutClick}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors border border-red-100"
                  >
                    <LogOut className="w-5 h-5" />
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
