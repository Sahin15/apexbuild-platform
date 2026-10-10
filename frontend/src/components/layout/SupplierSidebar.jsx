import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import SidebarUserProfile from './SidebarUserProfile';
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
  X,
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
  const { user } = useAuth();
  const { hasEntitlement } = useEntitlements();
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
              <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
                {user?.organizationId?.settings?.branding?.customAppName || 'ApexBuild'}
              </span>
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

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile />
      </div>
    </>
  );
}
