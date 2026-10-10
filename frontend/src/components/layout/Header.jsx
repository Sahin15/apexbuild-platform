import { useState, useRef, useEffect } from 'react';
import { 
  Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, 
  Settings, HelpCircle, Shield, Building2, CreditCard, ChevronRight, Crown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOSConfig } from '../../config/osThemes';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

export default function Header({ setSidebarOpen }) {
  const { user, logout } = useAuth();
  const { tier, planName } = useEntitlements();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  
  const osConfig = getOSConfig(user?.organizationId?.businessType, location.pathname);
  const isSuperAdmin = osConfig.key === 'SUPERADMIN' || user?.platformRole === 'SUPER_ADMIN';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
  };

  const getProfilePath = () => `${osConfig.baseRoute}/profile`;
  const getSettingsPath = () => `${osConfig.baseRoute}/settings`;
  const getSubscriptionPath = () => isSuperAdmin ? '/superadmin/subscriptions' : `${osConfig.baseRoute}/subscription`;
  const getSupportPath = () => `${osConfig.baseRoute}/support`;

  const initials = user?.name ? user.name.charAt(0) : (isSuperAdmin ? 'SA' : 'U');

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-40 sticky top-0 shrink-0">
      
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center flex-1 max-w-xl">
        {setSidebarOpen && (
          <button
            type="button"
            className="text-slate-500 hover:text-slate-700 focus:outline-none lg:hidden mr-4 cursor-pointer"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        )}
        
        {/* Global Search with OS-specific placeholder & focus ring */}
        <div className="w-full hidden sm:block relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className={`block w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50/80 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 sm:text-xs transition-all ${osConfig.theme.focusRing}`}
            placeholder={osConfig.searchPlaceholder}
          />
        </div>
      </div>

      {/* Right: Workspace Indicator, OS Pill, Notifications, Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Unified Workspace & OS Pill */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50/90 border border-slate-200/90 shadow-2xs">
          
          {/* Organization Name & Workspace Isolation Status */}
          <div className="flex flex-col text-right pr-3 border-r border-slate-200">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                {isSuperAdmin ? 'Platform' : 'Workspace'}
              </span>
              {isSuperAdmin ? (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded">
                  👑 HQ
                </span>
              ) : (
                <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                  🔒 Isolated
                </span>
              )}
            </div>
            <span 
              className="text-xs font-bold text-slate-800 truncate max-w-[160px]" 
              title={user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'ApexBuild')}
            >
              {user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'ApexBuild')}
            </span>
          </div>

          {/* OS Identifier Badge */}
          <div className="pr-3 border-r border-slate-200 flex items-center">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${osConfig.theme.badgeBg}`}>
              {osConfig.name}
            </span>
          </div>

          {/* Role Indicator */}
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Role</span>
            <span className={`text-xs font-bold capitalize ${osConfig.theme.roleColor}`}>
              {user?.role ? user.role.toLowerCase().replace('_', ' ') : (isSuperAdmin ? 'Super Admin' : 'Member')}
            </span>
          </div>
        </div>

        {/* Notifications */}
        <button 
          className="relative p-2 text-slate-400 hover:text-slate-600 focus:outline-none rounded-xl hover:bg-slate-100 transition-colors"
          title="Notifications"
        >
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          <Bell className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Profile Dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className={`relative h-9 w-9 rounded-xl border flex items-center justify-center font-bold text-xs shadow-2xs hover:ring-2 hover:ring-offset-2 transition-all focus:outline-none cursor-pointer ${osConfig.theme.avatarBg} ${osConfig.theme.avatarRing}`}
            title="User Profile & Settings"
            aria-label="User Profile"
          >
            <span>{initials.toUpperCase()}</span>
            <span className="absolute -bottom-0.5 -right-0.5 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2.5 w-80 rounded-2xl shadow-2xl shadow-slate-900/15 bg-white border border-slate-200/90 overflow-hidden transform opacity-100 scale-100 transition-all z-50 animate-in fade-in zoom-in-95 duration-150">
              
              {/* User & Workspace Identity Header */}
              <div className="p-4 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border shadow-xs ${osConfig.theme.avatarBg}`}>
                    {initials.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-bold text-slate-900 truncate" title={user?.name || 'User'}>
                        {user?.name || 'User'}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200/60 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5" title={user?.email || 'user@example.com'}>
                      {user?.email || 'user@example.com'}
                    </p>
                    
                    {/* Badge Chips Row */}
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${osConfig.theme.badgeBg}`}>
                        {osConfig.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        {user?.role ? user.role.replace('_', ' ') : (isSuperAdmin ? 'Super Admin' : 'Member')}
                      </span>
                      {!isSuperAdmin && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${osConfig.theme.tierBadge}`}>
                          <Crown className="w-3 h-3" />
                          {tier ? `${tier} Plan` : (planName || 'Plan')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Workspace Context Box */}
                <div className="mt-3.5 px-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span 
                      className="text-xs font-semibold text-slate-700 truncate" 
                      title={user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'Workspace')}
                    >
                      {user?.organizationId?.name || (isSuperAdmin ? 'ApexBuild Platform HQ' : 'ApexBuild')}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200 shrink-0">
                    {isSuperAdmin ? '👑 HQ Master' : '🔒 Tenant'}
                  </span>
                </div>
              </div>

              {/* Group 1: Personal & Workspace Navigation */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getProfilePath());
                  }}
                  className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${osConfig.theme.menuHoverBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${osConfig.theme.iconBg} transition-colors`}>
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        My Profile
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Personal info & password
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSettingsPath());
                  }}
                  className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${osConfig.theme.menuHoverBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${osConfig.theme.iconBg} transition-colors`}>
                      <Settings className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        Account Settings
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Workspace & preferences
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              </div>

              {/* Section Divider */}
              <div className="h-px bg-slate-100 mx-3" />

              {/* Group 2: Subscriptions, Tools & Support */}
              <div className="p-1.5 space-y-0.5">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSubscriptionPath());
                  }}
                  className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${osConfig.theme.menuHoverBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${osConfig.theme.iconBg} transition-colors`}>
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        {isSuperAdmin ? 'Platform Subscriptions' : 'Plan & Billing'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {isSuperAdmin ? 'Tenant pricing & plans' : 'Quotas, upgrades & invoices'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/superadmin/audit-logs');
                    }}
                    className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${osConfig.theme.menuHoverBg}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${osConfig.theme.iconBg} transition-colors`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                          Audit Logs
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Security & system trail
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                  </button>
                )}

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    navigate(getSupportPath());
                  }}
                  className={`group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${osConfig.theme.menuHoverBg}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${osConfig.theme.iconBg} transition-colors`}>
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900">
                        Help & Support
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Documentation & support desk
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                </button>
              </div>

              {/* Sign Out Footer */}
              <div className="p-1.5 bg-slate-50/70 border-t border-slate-100">
                <button
                  onClick={handleLogoutClick}
                  className="group flex items-center justify-between w-full px-3 py-2 rounded-xl text-left hover:bg-rose-50/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-rose-50 text-rose-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-600 group-hover:text-rose-700">
                        Sign out
                      </p>
                      <p className="text-[10px] text-slate-400">
                        End your current session
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 group-hover:text-rose-500 transition-colors uppercase tracking-wider">
                    Exit
                  </span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </header>
  );
}
