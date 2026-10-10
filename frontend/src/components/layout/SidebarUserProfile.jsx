import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  User as UserIcon, Settings, CreditCard, HelpCircle, 
  LogOut, Crown, ChevronUp, Shield, Building2 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import { getOSConfig } from '../../config/osThemes';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

export default function SidebarUserProfile({ customSubtitle }) {
  const { user, logout } = useAuth();
  const { tier, planName } = useEntitlements();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const menuRef = useRef(null);

  const osConfig = getOSConfig(user?.organizationId?.businessType, location.pathname);
  const isSuperAdmin = osConfig.key === 'SUPERADMIN' || user?.platformRole === 'SUPER_ADMIN';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setMenuOpen(false);
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
  
  const roleDisplay = user?.role 
    ? user.role.replace('_', ' ') 
    : (isSuperAdmin ? 'Super Admin' : 'Member');

  const subtitleDisplay = customSubtitle || `${osConfig.roleTag} ${roleDisplay}`;

  return (
    <div className={`p-3 border-t ${osConfig.theme.sidebarBorder} relative shrink-0`} ref={menuRef}>
      {/* Floating Popup Card */}
      {menuOpen && (
        <div className={`absolute bottom-full left-3 right-3 mb-2.5 rounded-2xl shadow-2xl backdrop-blur-xl border ${osConfig.theme.sidebarCardBg} ${osConfig.theme.sidebarCardBorder} overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150`}>
          
          {/* Header Info */}
          <div className="p-3.5 border-b border-white/10">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${osConfig.theme.badgeBg}`}>
                {osConfig.name}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {roleDisplay}
              </span>
            </div>
            <p className="text-sm font-bold text-white truncate" title={user?.name || 'User'}>
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-400 truncate" title={user?.email || 'user@example.com'}>
              {user?.email || 'user@example.com'}
            </p>
          </div>

          {/* Plan & Upgrade Section */}
          <div className="p-2.5 border-b border-white/10">
            {isSuperAdmin ? (
              <div className="flex items-center justify-between px-2.5 py-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-300">PLATFORM MASTER</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                  👑 HQ
                </span>
              </div>
            ) : (
              <div className={`flex items-center justify-between px-2.5 py-2 rounded-xl border ${osConfig.theme.planPillBg}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Crown className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold truncate">
                    {tier ? `${tier} Plan` : (planName || 'Plan')}
                  </span>
                </div>
                {tier !== 'ENTERPRISE' && (
                  <button 
                    onClick={() => {
                      setMenuOpen(false);
                      navigate(getSubscriptionPath());
                    }} 
                    className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm transition-all cursor-pointer ${osConfig.theme.upgradeBtnBg}`}
                  >
                    Upgrade
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="p-1.5 space-y-0.5">
            <button 
              onClick={() => { setMenuOpen(false); navigate(getProfilePath()); }} 
              className="group flex w-full items-center px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <UserIcon className={`mr-2.5 h-4 w-4 text-slate-400 group-hover:${osConfig.theme.accentText} transition-colors`} />
              My Profile
            </button>

            <button 
              onClick={() => { setMenuOpen(false); navigate(getSettingsPath()); }} 
              className="group flex w-full items-center px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Settings className={`mr-2.5 h-4 w-4 text-slate-400 group-hover:${osConfig.theme.accentText} transition-colors`} />
              Settings
            </button>

            <button 
              onClick={() => { setMenuOpen(false); navigate(getSubscriptionPath()); }} 
              className="group flex w-full items-center px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <CreditCard className={`mr-2.5 h-4 w-4 text-slate-400 group-hover:${osConfig.theme.accentText} transition-colors`} />
              {isSuperAdmin ? 'Subscriptions' : 'Plan & Billing'}
            </button>

            {isSuperAdmin && (
              <button 
                onClick={() => { setMenuOpen(false); navigate('/superadmin/audit-logs'); }} 
                className="group flex w-full items-center px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <Shield className={`mr-2.5 h-4 w-4 text-slate-400 group-hover:${osConfig.theme.accentText} transition-colors`} />
                Audit Logs
              </button>
            )}

            <button 
              onClick={() => { setMenuOpen(false); navigate(getSupportPath()); }} 
              className="group flex w-full items-center px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <HelpCircle className={`mr-2.5 h-4 w-4 text-slate-400 group-hover:${osConfig.theme.accentText} transition-colors`} />
              Help & Support
            </button>
          </div>

          {/* Sign Out Action */}
          <div className="p-1.5 border-t border-white/10 bg-black/10">
            <button 
              onClick={handleLogoutClick} 
              className="group flex w-full items-center px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="mr-2.5 h-4 w-4 text-red-400 group-hover:text-red-300" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Bottom Trigger Button */}
      <button 
        onClick={() => setMenuOpen(!menuOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/10 ${osConfig.theme.sidebarBtnBg}`}
        aria-label="User Profile Menu"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`flex-shrink-0 h-8 w-8 rounded-lg ${osConfig.theme.logoBg} flex items-center justify-center text-white font-black text-xs shadow-sm`}>
            {initials.toUpperCase()}
          </div>
          <div className="text-left truncate">
            <p className={`text-xs font-bold text-white truncate w-32 group-hover:${osConfig.theme.accentText} transition-colors`}>
              {user?.name || 'User'}
            </p>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-wider">
              {subtitleDisplay}
            </p>
          </div>
        </div>
        <ChevronUp className={`w-4 h-4 transition-transform duration-200 shrink-0 ${menuOpen ? 'rotate-180 text-white' : 'text-slate-400 group-hover:text-white'}`} />
      </button>

      {/* Global Confirmation Modal */}
      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
