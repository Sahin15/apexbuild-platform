import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, ClipboardList, TestTube2, Menu, Bell, 
  Search, Plus, Activity, DollarSign, Package, Settings, LogOut, X, ChevronRight, FileText,
  ChevronUp, User as UserIcon, HelpCircle, CreditCard, ShieldCheck, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useEntitlements } from '../../context/EntitlementContext';
import Header from './Header';
import SidebarUserProfile from './SidebarUserProfile';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

const DiagnosticsLayout = () => {
  const { user, logout } = useAuth();
  const { hasEntitlement, planName, tier } = useEntitlements();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = React.useRef(null);

  const [topMenuOpen, setTopMenuOpen] = useState(false);
  const topMenuRef = React.useRef(null);

  // Close profile menus when clicking outside
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

  // Close mobile menus on route change and scroll to top
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMoreMenuOpen(false);
    // Only scroll to top if we don't have a hash in the URL, to preserve anchor links
    if (!location.hash) {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setMenuOpen(false);
    setTopMenuOpen(false);
    setIsMoreMenuOpen(false);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/diagnostics/dashboard', icon: Home },
    { name: 'Patients', path: '/diagnostics/patients', icon: Users },
    { name: 'Orders', path: '/diagnostics/orders', icon: ClipboardList },
    { name: 'Samples', path: '/diagnostics/samples', icon: TestTube2, feature: 'sampleTracking', tier: 'PRO' },
    { name: 'Result Entry', path: '/diagnostics/results', icon: ClipboardList },
  ];

  const moreMenuLinks = [
    { name: 'Quality Control (QC)', path: '/diagnostics/qc', icon: ShieldCheck, feature: 'qualityControl', tier: 'ENT' },
    { name: 'Tests & Panels', path: '/diagnostics/tests', icon: Activity },
    { name: 'Doctors', path: '/diagnostics/doctors', icon: Users, feature: 'doctorCommissions', tier: 'ENT' },
    { name: 'Reports', path: '/diagnostics/reports', icon: FileText },
    { name: 'Payments', path: '/diagnostics/payments', icon: DollarSign },
    { name: 'Inventory', path: '/diagnostics/inventory', icon: Package },
    { name: 'Settings', path: '/diagnostics/settings', icon: Settings },
    { name: 'Subscription', path: '/diagnostics/subscription', icon: CreditCard },
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/patients')) return 'Patients';
    if (path.includes('/orders')) return 'Orders';
    if (path.includes('/samples')) return 'Samples';
    if (path.includes('/results')) return 'Result Entry';
    if (path.includes('/reports')) return 'Reports';
    if (path.includes('/qc')) return 'Quality Control (IQC)';
    if (path.includes('/inventory')) return 'Inventory';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/tests')) return 'Tests & Panels';
    if (path.includes('/doctors')) return 'Doctors';
    return 'Diagnostics OS';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-cyan-950 border-r border-cyan-900 fixed inset-y-0 z-20">
        <div className="h-16 flex items-center gap-3 px-6 bg-cyan-950 border-b border-cyan-900 shrink-0">
          <div className="w-8 h-8 bg-cyan-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md shadow-cyan-600/30">
            DX
          </div>
          <div className="flex flex-col">
            <span className="text-white text-base font-bold tracking-tight leading-none">ApexBuild</span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mt-0.5">Diagnostics OS</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-cyan-800">
          <nav className="px-4 space-y-1">
            {navItems.map((item) => {
              const isLocked = item.feature && !hasEntitlement(item.feature);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-3 shrink-0 ${isActive(item.path) ? 'text-white' : 'text-cyan-300'}`} />
                  <span className="flex-1 truncate">{item.name}</span>
                  {isLocked && (
                    <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Lock className="w-2.5 h-2.5" />
                      {item.tier || 'PRO'}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-cyan-900">
              <p className="px-3 text-xs font-bold text-cyan-600 uppercase tracking-wider mb-2">
                Management
              </p>
              {moreMenuLinks.map((item) => {
                const isLocked = item.feature && !hasEntitlement(item.feature);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-cyan-100 hover:bg-cyan-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 mr-3 shrink-0 ${isActive(item.path) ? 'text-white' : 'text-cyan-300'}`} />
                    <span className="flex-1 truncate">{item.name}</span>
                    {isLocked && (
                      <span className="ml-auto inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <Lock className="w-2.5 h-2.5" />
                        {item.tier || 'PRO'}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen pb-16 md:pb-0">
        <Header setSidebarOpen={setIsMoreMenuOpen} />

        {/* Content Outlet */}
        <div className="flex-1 overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive(item.path) ? 'text-cyan-700' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-6 w-6 ${isActive(item.path) ? 'fill-cyan-50 text-cyan-600' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          ))}
          
          {/* More Menu Toggle */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isMoreMenuOpen ? 'text-cyan-700' : 'text-gray-500'
            }`}
          >
            <Menu className={`h-6 w-6 ${isMoreMenuOpen ? 'text-cyan-600' : ''}`} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile More Menu Full Screen Overlay */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-gray-50 flex flex-col pt-safe animate-in slide-in-from-bottom-full duration-200">
          <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Diagnostics Menu</h2>
            <button 
              onClick={() => setIsMoreMenuOpen(false)}
              className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* User Profile Summary */}
            <div className="bg-white p-4 mb-2 border-b border-gray-100">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center">
                  <span className="text-lg font-black text-cyan-700">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="text-base font-bold text-gray-900 leading-tight">{user?.name || 'User'}</p>
                  <p className="text-xs font-bold text-cyan-600 uppercase tracking-wider mt-1">{user?.role || 'Role'}</p>
                </div>
              </div>
            </div>

            {/* Application Links */}
            <div className="bg-white py-2 mb-2 border-y border-gray-100">
              {moreMenuLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={`flex items-center px-6 py-3.5 text-sm font-medium transition-colors ${
                    isActive(item.path) ? 'text-cyan-700 bg-cyan-50 border-l-4 border-cyan-600' : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  <item.icon className={`h-5 w-5 mr-4 ${isActive(item.path) ? 'text-cyan-600' : 'text-gray-400'}`} />
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Account & Support Links */}
            <div className="bg-white py-2 border-y border-gray-100">
              <Link
                to="/diagnostics/profile"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <UserIcon className="h-5 w-5 mr-4 text-gray-400" />
                My Profile
              </Link>
              <Link
                to="/diagnostics/support"
                onClick={() => setIsMoreMenuOpen(false)}
                className="flex items-center px-6 py-3.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <HelpCircle className="h-5 w-5 mr-4 text-gray-400" />
                Help & Support
              </Link>
              
              <button 
                onClick={handleLogoutClick}
                className="w-full flex items-center px-6 py-3.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-4 text-red-500" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
};

export default DiagnosticsLayout;
