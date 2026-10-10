import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Briefcase, ClipboardList, Users, Receipt, Menu, Plus, 
  LayoutDashboard, Building2, Calculator, Package, Truck, 
  Ruler, FileSpreadsheet, Files, Settings, X, LogOut, ChevronRight, CheckSquare, TrendingUp
} from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import PWAInstallBanner from '../common/PWAInstallBanner';
import OfflineStatusBanner from '../common/OfflineStatusBanner';

const bottomNavItems = [
  { name: 'Projects', href: '/projects', icon: Briefcase, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'] },
  { name: 'Site DPR', href: '/site-reports', icon: ClipboardList, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'] },
  { name: 'Labour', href: '/labour', icon: Users, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'] },
  { name: 'Expenses', href: '/expenses', icon: Receipt, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'] },
];

const secondaryNavItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'SUPERVISOR', 'STORE_MANAGER', 'VIEWER'] },
  { name: 'Materials', href: '/materials', icon: Package, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'STORE_MANAGER'] },
  { name: 'Machinery & Fuel', href: '/equipment', icon: Truck, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'] },
  { name: 'Site Snags', href: '/snags', icon: CheckSquare, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'] },
  { name: 'BOQ & Estimates', href: '/boq', icon: Calculator, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT'] },
  { name: 'Clients', href: '/clients', icon: Building2, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER'] },
  { name: 'Measurements', href: '/measurements', icon: Ruler, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
  { name: 'Billing & RA', href: '/billing', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Cash Flow & P&L', href: '/cashflow', icon: TrendingUp, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'] },
  { name: 'Drawings & Vault', href: '/documents', icon: Files, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'STORE_MANAGER', 'ACCOUNTANT', 'VIEWER'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { primaryColor } = useBrandTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setIsDrawerOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden w-full relative">
      {/* Universal Offline Status Indicator */}
      <OfflineStatusBanner />

      {/* Universal PWA Mobile Install Banner */}
      <PWAInstallBanner />

      {/* Desktop / Tablet Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header setSidebarOpen={setSidebarOpen} />
        
        {/* Dynamic Page Content with Safe Area Bottom Padding */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 lg:pb-8 overscroll-contain">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Global Floating Action Button for Construction Site Field Teams */}
        <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end">
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-4 duration-200">
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/site-reports'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  New DPR / Site Log
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-600 border border-blue-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
              </button>
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/expenses'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  Petty Cash / Expense
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-600 border border-blue-100">
                  <Receipt className="w-5 h-5" />
                </div>
              </button>
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/labour'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  Labour Attendance
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-blue-600 border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            style={{ backgroundColor: primaryColor || '#2563eb' }}
            aria-label="Contractor Field Quick Actions"
            className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl text-white transition-transform duration-200 touch-manipulation active:scale-95 ${isFabOpen ? 'rotate-45 brightness-90' : 'hover:brightness-110'}`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {isFabOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-20" 
            onClick={() => setIsFabOpen(false)}
          />
        )}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 flex items-center justify-around h-16 z-40 flex-shrink-0 pb-safe fixed bottom-0 left-0 w-full shadow-lg">
          {bottomNavItems.filter(item => item.roles.includes(user?.role || 'VIEWER')).map((item) => {
            const isActive = location.pathname.includes(item.href);
            return (
              <NavLink
                key={item.name}
                to={item.href}
                style={isActive ? { color: primaryColor || '#2563eb' } : {}}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-manipulation ${
                  isActive ? 'font-bold' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} style={isActive ? { color: primaryColor || '#2563eb' } : {}} />
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

        {/* Mobile Navigation Drawer (Bottom Sheet) */}
        {isDrawerOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="bg-white w-full max-h-[85vh] rounded-t-3xl shadow-2xl relative z-10 flex flex-col animate-in slide-in-from-bottom-full duration-300 pb-safe">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex flex-col">
                  <span className="text-lg font-black text-slate-900">Contractor Navigation</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    {user?.organizationId?.name || 'Civil Projects Platform'}
                  </span>
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
                            ? 'bg-blue-50 text-blue-800 border border-blue-200 shadow-xs' 
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ 
                              backgroundColor: isActive ? `${primaryColor}20` : '#f1f5f9',
                              color: isActive ? (primaryColor || '#2563eb') : '#64748b'
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
