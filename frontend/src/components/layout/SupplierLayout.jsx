import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingCart, Layers, Users, Menu, Plus, 
  FileText, Truck, FileSpreadsheet, CreditCard, Receipt, 
  LineChart, Settings, X, LogOut, ChevronRight, User as UserIcon
} from 'lucide-react';
import SupplierSidebar from './SupplierSidebar';
import Header from './Header';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';
import PWAInstallBanner from '../common/PWAInstallBanner';
import OfflineStatusBanner from '../common/OfflineStatusBanner';
import NotificationPermissionBanner from '../common/NotificationPermissionBanner';

const bottomNavItems = [
  { name: 'Dashboard', href: '/supplier/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Orders', href: '/supplier/orders', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Inventory', href: '/supplier/inventory', icon: Layers, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Customers', href: '/supplier/customers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
];

const secondaryNavItems = [
  { name: 'Quotations', href: '/supplier/quotations', icon: FileText, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Deliveries', href: '/supplier/deliveries', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'STAFF'] },
  { name: 'Invoices', href: '/supplier/invoices', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'] },
  { name: 'Purchases', href: '/supplier/purchases', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'Suppliers', href: '/supplier/suppliers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/supplier/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Expenses', href: '/supplier/expenses', icon: Receipt, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Reports', href: '/supplier/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Settings', href: '/supplier/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] }
];

export default function SupplierLayout() {
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

      {/* Mobile Push Notification Permission Prompt */}
      <NotificationPermissionBanner />

      {/* Desktop / Tablet Sidebar */}
      <SupplierSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header setSidebarOpen={setSidebarOpen} />
        
        {/* Dynamic Page Content with Safe Bottom Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6 lg:p-8 pb-28 lg:pb-8 overscroll-contain">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>

        {/* Global Floating Action Button (Mobile Only) */}
        <div className="lg:hidden fixed bottom-20 right-4 z-30 flex flex-col items-end">
          {isFabOpen && (
            <div className="flex flex-col gap-3 mb-4 items-end animate-in slide-in-from-bottom-4 duration-200">
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/supplier/orders'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  New Order
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-600 border border-emerald-100">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </button>
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/supplier/invoices'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  New Invoice
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-600 border border-emerald-100">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
              </button>
              <button 
                onClick={() => { setIsFabOpen(false); navigate('/supplier/purchases'); }} 
                className="flex items-center gap-3 group"
              >
                <span className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-lg text-slate-800 border border-slate-100">
                  Inward Stock
                </span>
                <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg text-emerald-600 border border-emerald-100">
                  <Layers className="w-5 h-5" />
                </div>
              </button>
            </div>
          )}
          
          <button 
            onClick={() => setIsFabOpen(!isFabOpen)}
            style={{ backgroundColor: primaryColor || '#059669' }}
            aria-label="Supplier Quick Actions"
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
                style={isActive ? { color: primaryColor || '#059669' } : {}}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors touch-manipulation ${
                  isActive ? 'font-bold' : 'text-slate-400 hover:text-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} style={isActive ? { color: primaryColor || '#059669' } : {}} />
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
                  <span className="text-lg font-black text-slate-900">Supplier Navigation</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    {user?.organizationId?.name || 'Building Materials OS'}
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
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs' 
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ 
                              backgroundColor: isActive ? `${primaryColor}20` : '#f1f5f9',
                              color: isActive ? (primaryColor || '#059669') : '#64748b'
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
