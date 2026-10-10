import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calculator, 
  ClipboardList, 
  Users, 
  Package, 
  Receipt, 
  Ruler, 
  FileSpreadsheet, 
  Files, 
  UsersRound, 
  Building2,
  LineChart, 
  Settings, 
  HelpCircle,
  X,
  LogOut,
  User as UserIcon,
  Crown,
  ChevronUp,
  TrendingUp,
  Truck,
  CheckSquare,
  Lock
} from 'lucide-react';
import SidebarUserProfile from './SidebarUserProfile';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'SUPERVISOR', 'STORE_MANAGER', 'VIEWER'] },
  { name: 'Clients', href: '/clients', icon: Building2, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER'] },
  { name: 'Projects', href: '/projects', icon: Briefcase, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'] },
  { name: 'BOQ & Estimates', href: '/boq', icon: Calculator, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT'] },
  { name: 'Site Reports', href: '/site-reports', icon: ClipboardList, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'] },
  { name: 'Site Snags', href: '/snags', icon: CheckSquare, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'VIEWER'], feature: 'snagVault', tier: 'PRO' },
  { name: 'Labour', href: '/labour', icon: Users, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'] },
  { name: 'Materials', href: '/materials', icon: Package, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'STORE_MANAGER'] },
  { name: 'Machinery & Fuel', href: '/equipment', icon: Truck, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'], feature: 'machineryDiesel', tier: 'ENT' },
  { name: 'Petty Cash & Expenses', href: '/expenses', icon: Receipt, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'], feature: 'pettyCashLedger', tier: 'PRO' },
  { name: 'Measurements', href: '/measurements', icon: Ruler, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'] },
  { name: 'Billing & RA', href: '/billing', icon: FileSpreadsheet, roles: ['OWNER', 'ADMIN', 'ACCOUNTANT'] },
  { name: 'Cash Flow & P&L', href: '/cashflow', icon: TrendingUp, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'], feature: 'civilPnL', tier: 'ENT' },
  { name: 'Drawings & Vault', href: '/documents', icon: Files, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'STORE_MANAGER', 'ACCOUNTANT', 'VIEWER'], feature: 'drawingVault', tier: 'ENT' },
  { name: 'Team', href: '/team', icon: UsersRound, roles: ['OWNER', 'ADMIN'] },
  { name: 'Reports', href: '/reports', icon: LineChart, roles: ['OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['OWNER', 'ADMIN'] },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, navigation: customNavigation, title: customTitle, subtitle: customSubtitle }) {
  const { user } = useAuth();
  const { hasEntitlement } = useEntitlements();
  
  const navItems = customNavigation || navigation;
  const filteredNav = customNavigation ? navItems : navItems.filter(item => item.roles.includes(user?.role));

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
        fixed inset-y-0 left-0 z-30 w-64 bg-navy-900 text-slate-300 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col
      `}>
        {/* Logo area */}
        <div className="flex items-center justify-between h-16 px-6 bg-navy-900 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-600/30">
              A
            </div>
            <div className="flex flex-col">
              <span className="text-white text-base font-bold tracking-tight leading-none truncate max-w-[140px]">
                {customTitle || user?.organizationId?.settings?.branding?.customAppName || 'ApexBuild'}
              </span>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mt-0.5">{customSubtitle || 'Contractor OS'}</span>
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
        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-navy-700">
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
                      ? 'bg-primary-600 text-white' 
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'}
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
        <SidebarUserProfile customSubtitle={customSubtitle} />
      </div>
    </>
  );
}
