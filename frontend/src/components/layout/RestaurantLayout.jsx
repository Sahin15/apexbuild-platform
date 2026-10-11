import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UtensilsCrossed, ChefHat, Grid3x3, BookOpen, 
  FileSpreadsheet, Package, Truck, Users, Coins, Receipt, 
  BarChart3, Settings, CreditCard, Menu, X, Plus, Clock,
  User as UserIcon, HelpCircle, LogOut, Lock, Sparkles, ChevronRight,
  Flame, ShoppingBag, Store, CalendarCheck
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

export default function RestaurantLayout() {
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

  // Primary active modules
  const coreNavItems = [
    { 
      name: 'Dashboard', 
      path: '/restaurant/dashboard', 
      icon: LayoutDashboard,
      status: 'active'
    },
    { 
      name: 'Touch POS', 
      path: '/restaurant/pos', 
      icon: UtensilsCrossed,
      status: 'active',
      badge: 'Terminal'
    },
    { 
      name: 'Kitchen Display (KDS)', 
      path: '/restaurant/kitchen', 
      icon: ChefHat,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Online Delivery (Zomato/Swiggy)', 
      path: '/restaurant/aggregators', 
      icon: Truck,
      status: 'active',
      badge: 'Live'
    },
  ];

  // Planned & Management modules
  const managementNavItems = [
    { 
      name: 'Tables & Floor', 
      path: '/restaurant/tables', 
      icon: Grid3x3,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Reservations', 
      path: '/restaurant/reservations', 
      icon: CalendarCheck,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Menu & Pricing', 
      path: '/restaurant/menu', 
      icon: BookOpen,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Billing & Invoices', 
      path: '/restaurant/billing', 
      icon: Receipt,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Recipes & Food Costing', 
      path: '/restaurant/recipes', 
      icon: FileSpreadsheet,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Ingredient Inventory', 
      path: '/restaurant/inventory', 
      icon: Package,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Suppliers & Purchases', 
      path: '/restaurant/purchases', 
      icon: Truck,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Customer Directory', 
      path: '/restaurant/customers', 
      icon: Users,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Cashier Shifts & Drops', 
      path: '/restaurant/shifts', 
      icon: Coins,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Operating Expenses', 
      path: '/restaurant/expenses', 
      icon: Receipt,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Financial Reports & P&L', 
      path: '/restaurant/reports', 
      icon: BarChart3,
      status: 'active',
      badge: 'Live'
    },
    { 
      name: 'Restaurant Settings', 
      path: '/restaurant/settings', 
      icon: Settings,
      status: 'active'
    },
    { 
      name: 'Plan & Billing', 
      path: '/restaurant/subscription', 
      icon: CreditCard,
      status: 'active'
    },
  ];

  const effectivePrimary = primaryColor || '#EA580C';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      {/* Universal PWA, Offline & Notification Banners */}
      <OfflineStatusBanner />
      <PWAInstallBanner />
      <NotificationPermissionBanner />
      <PWAUpdatePrompt />

      {/* Desktop Sidebar (Fixed 64-width with dark culinary styling) */}
      <aside className="hidden md:flex flex-col w-64 bg-stone-900 border-r border-stone-800 fixed inset-y-0 z-20">
        
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 bg-stone-950 border-b border-stone-800 shrink-0">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md transition-colors"
            style={{ 
              backgroundColor: effectivePrimary, 
              boxShadow: `0 4px 14px ${effectivePrimary}40` 
            }}
          >
            RT
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
              {user?.organizationId?.settings?.branding?.customAppName || user?.organizationId?.name || 'ApexBuild'}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: effectivePrimary }}>
              Restaurant OS
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-stone-800">
          <nav className="px-3 space-y-1">
            
            {/* Core Operational Section */}
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Operations
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
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-4 w-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-stone-400 group-hover:text-stone-200'}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {item.badge && (
                    <span 
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs ${
                        active 
                          ? 'bg-white/20 text-white' 
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Management & Logistics Section */}
            <div className="pt-4 mt-4 border-t border-stone-800">
              <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Restaurant Management
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
                          ? 'text-stone-400 hover:bg-stone-800/60 hover:text-stone-200'
                          : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 mr-3 shrink-0 ${active ? 'text-white' : 'text-stone-500 group-hover:text-stone-300'}`} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.tag && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-700/60">
                        {item.tag}
                      </span>
                    )}
                    {item.tier && (
                      <span className="ml-1 inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Lock className="w-2 h-2" />
                        {item.tier}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

          </nav>
        </div>

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile customSubtitle="F&B Management" />
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
              onClick={() => { setIsFabOpen(false); navigate('/restaurant/pos'); }} 
              className="flex items-center gap-3 group"
            >
              <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                Touch POS Terminal
              </span>
              <div 
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg border border-orange-100"
                style={{ color: effectivePrimary }}
              >
                <UtensilsCrossed className="w-5 h-5" />
              </div>
            </button>
            <button 
              onClick={() => { setIsFabOpen(false); navigate('/restaurant/kitchen'); }} 
              className="flex items-center gap-3 group"
            >
              <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                Kitchen Display (KDS)
              </span>
              <div 
                className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg border border-orange-100"
                style={{ color: effectivePrimary }}
              >
                <ChefHat className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}
        
        <button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          style={{ backgroundColor: effectivePrimary }}
          aria-label="Restaurant Quick Actions"
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/restaurant/dashboard"
            style={isActive('/restaurant/dashboard') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/restaurant/dashboard') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard className="h-5 w-5" strokeWidth={isActive('/restaurant/dashboard') ? 2.5 : 2} />
            <span className="text-[10px]">Dashboard</span>
          </Link>

          <Link
            to="/restaurant/pos"
            style={isActive('/restaurant/pos') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/restaurant/pos') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <UtensilsCrossed className="h-5 w-5" strokeWidth={isActive('/restaurant/pos') ? 2.5 : 2} />
            <span className="text-[10px]">POS</span>
          </Link>

          <Link
            to="/restaurant/kitchen"
            style={isActive('/restaurant/kitchen') ? { color: effectivePrimary } : {}}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isActive('/restaurant/kitchen') ? 'font-bold' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <ChefHat className="h-5 w-5" strokeWidth={isActive('/restaurant/kitchen') ? 2.5 : 2} />
            <span className="text-[10px]">Kitchen</span>
          </Link>

          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 touch-manipulation ${
              isMoreMenuOpen ? 'text-orange-600 font-bold' : 'text-slate-400 hover:text-slate-700'
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
                RT
              </div>
              <h2 className="text-base font-bold text-slate-900">Restaurant OS Menu</h2>
            </div>
            <button 
              onClick={() => setIsMoreMenuOpen(false)}
              className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
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
                  {user?.name?.charAt(0).toUpperCase() || 'R'}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5 text-orange-600">
                    {user?.role || 'Staff'} • {user?.organizationId?.name || 'Restaurant Workspace'}
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
                    isActive(item.path) ? 'text-orange-700 bg-orange-50 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span>{item.name}</span>
                  </div>
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
                to="/restaurant/profile"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserIcon className="h-4 w-4 mr-3 text-slate-400" />
                My Profile
              </Link>
              <Link
                to="/restaurant/support"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-5 py-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <HelpCircle className="h-4 w-4 mr-3 text-slate-400" />
                Help & Operations Support
              </Link>
              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center px-5 py-3 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
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
