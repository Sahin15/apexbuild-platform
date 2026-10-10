import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { useConfirm } from '../../contexts/ConfirmContext';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Layers, 
  FileText, 
  ShoppingCart, 
  Truck, 
  FileSpreadsheet, 
  CreditCard,
  Receipt,
  LineChart,
  Files,
  UsersRound,
  Settings,
  HelpCircle,
  X,
  LogOut,
  User as UserIcon,
  Crown,
  ChevronUp,
  Lock
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/supplier/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Customers', href: '/supplier/customers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'], feature: 'directCustomerLedger', tier: 'PRO' },
  { name: 'Products', href: '/supplier/products', icon: Package, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Inventory', href: '/supplier/inventory', icon: Layers, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'], feature: 'inventoryLedger', tier: 'ENT' },
  { name: 'Quotations', href: '/supplier/quotations', icon: FileText, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Orders', href: '/supplier/orders', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES'] },
  { name: 'Deliveries', href: '/supplier/deliveries', icon: Truck, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'STAFF'], feature: 'vehicleFleet', tier: 'PRO' },
  { name: 'Invoices', href: '/supplier/invoices', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'] },
  { name: 'Purchases', href: '/supplier/purchases', icon: ShoppingCart, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'Suppliers', href: '/supplier/suppliers', icon: Users, roles: ['OWNER', 'ADMIN', 'MANAGER', 'ACCOUNTANT'] },
  { name: 'Payments', href: '/supplier/payments', icon: CreditCard, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Expenses', href: '/supplier/expenses', icon: Receipt, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Reports', href: '/supplier/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Documents', href: '/supplier/documents', icon: Files, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SALES', 'ACCOUNTANT', 'STAFF'] },
  { name: 'Team', href: '/supplier/team', icon: UsersRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Settings', href: '/supplier/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

export default function SupplierSidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { hasEntitlement, planName, tier } = useEntitlements();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const filteredNav = navigation.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 shrink-0 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-600/30">
              S
            </div>
            <div className="flex flex-col">
              <span className="text-white text-base font-bold tracking-tight leading-none">ApexBuild</span>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Supplier OS</span>
            </div>
          </div>
          <button 
            className="lg:hidden text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-slate-700">
          <nav className="px-3 space-y-1">
            {filteredNav.map((item) => {
              const isLocked = item.feature && !hasEntitlement(item.feature);
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => `
                    flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                  `}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-5 w-5" aria-hidden="true" />
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
          </nav>
        </div>

        {/* Bottom section */}
        <div className="p-4 border-t border-slate-800 relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-slate-800 rounded-xl shadow-xl ring-1 ring-white/10 overflow-hidden transform transition-all">
              <div className="p-3 border-b border-slate-700 bg-slate-800/50">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@apexbuild.com'}</p>
              </div>
              
              <div className="p-2 border-b border-slate-700">
                <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-400 truncate max-w-[110px]">{planName}</span>
                  </div>
                  {tier !== 'ENTERPRISE' && (
                    <button onClick={() => { setMenuOpen(false); navigate('/supplier/settings'); }} className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 px-2 py-1 rounded transition-colors cursor-pointer">
                      UPGRADE
                    </button>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button onClick={() => { setMenuOpen(false); navigate('/supplier/profile'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <UserIcon className="mr-2 h-4 w-4 text-slate-400 group-hover:text-emerald-400" /> My Profile
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/supplier/settings'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <Settings className="mr-2 h-4 w-4 text-slate-400 group-hover:text-emerald-400" /> Settings
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/supplier/support'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <HelpCircle className="mr-2 h-4 w-4 text-slate-400 group-hover:text-emerald-400" /> Help & Support
                </button>
              </div>
              <div className="py-1 border-t border-slate-700">
                <button onClick={async () => { 
                  const isConfirmed = await confirm({
                    title: 'Sign Out',
                    message: 'Are you sure you want to sign out?',
                    confirmText: 'Sign Out',
                    type: 'warning'
                  });
                  if (isConfirmed) logout(); 
                }} className="group flex w-full items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                  <LogOut className="mr-2 h-4 w-4 text-red-400/80 group-hover:text-red-400" /> Sign out
                </button>
              </div>
            </div>
          )}

          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-600"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left truncate">
                <p className="text-sm font-semibold text-white truncate w-32 group-hover:text-emerald-400 transition-colors">{user?.name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate tracking-wide">
                  SUPPLIER {user?.role ? user.role : ''}
                </p>
              </div>
            </div>
            <ChevronUp className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${menuOpen ? 'rotate-180 text-white' : 'group-hover:text-white'}`} />
          </button>
        </div>
      </div>
    </>
  );
}
