import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { useConfirm } from '../../contexts/ConfirmContext';
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center text-white font-bold text-lg">
              A
            </div>
            <span className="text-white text-xl font-semibold tracking-tight">{customTitle || 'ApexBuild'}</span>
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

        {/* Bottom section */}
        <div className="p-4 border-t border-navy-800 relative" ref={menuRef}>
          {menuOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-56 bg-navy-800 rounded-xl shadow-xl ring-1 ring-white/10 overflow-hidden transform transition-all">
              <div className="p-3 border-b border-navy-700 bg-navy-800/50">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || 'user@apexbuild.com'}</p>
              </div>
              
              <div className="p-2 border-b border-navy-700">
                <div className="flex items-center justify-between px-2 py-1.5 bg-primary-500/10 rounded-lg border border-primary-500/20">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary-400" />
                    <span className="text-xs font-semibold text-primary-400 truncate max-w-[110px]">{planName}</span>
                  </div>
                  {tier !== 'ENTERPRISE' && (
                    <button onClick={() => { setMenuOpen(false); navigate('/subscription'); }} className="text-[10px] font-bold text-white bg-primary-600 hover:bg-primary-500 px-2 py-1 rounded transition-colors cursor-pointer">
                      UPGRADE
                    </button>
                  )}
                </div>
              </div>

              <div className="py-1">
                <button onClick={() => { setMenuOpen(false); navigate('/profile'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-navy-700 hover:text-white transition-colors">
                  <UserIcon className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary-400" /> My Profile
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/settings'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-navy-700 hover:text-white transition-colors">
                  <Settings className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary-400" /> Settings
                </button>
                <button onClick={() => { setMenuOpen(false); navigate('/support'); }} className="group flex w-full items-center px-3 py-2 text-sm text-slate-300 hover:bg-navy-700 hover:text-white transition-colors">
                  <HelpCircle className="mr-2 h-4 w-4 text-slate-400 group-hover:text-primary-400" /> Help & Support
                </button>
              </div>
              <div className="py-1 border-t border-navy-700">
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
            className="w-full flex items-center justify-between px-3 py-2 bg-navy-800 hover:bg-navy-700 rounded-lg transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy-600"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center text-white font-medium shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-left truncate">
                <p className="text-sm font-semibold text-white truncate w-32 group-hover:text-primary-400 transition-colors">{user?.name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate tracking-wide uppercase">
                  {customSubtitle || `CONTRACTOR ${user?.role ? user.role.replace('_', ' ') : ''}`}
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
