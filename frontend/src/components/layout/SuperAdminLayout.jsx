import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Building2, Users, HardDrive, CreditCard, 
  Receipt, Activity, Settings, Bell,
  FileText, ArrowLeftRight, Database, Headset, Landmark, TrendingUp,
  Search, LogOut, ChevronDown, Monitor, LayoutDashboard, Globe, FileImage, LayoutTemplate, Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import LogoutConfirmationModal from '../common/LogoutConfirmationModal';

const navigation = [
  { name: 'Dashboard', href: '/superadmin/dashboard', icon: LayoutDashboard },
  { 
    name: 'Business Management', 
    isHeader: true,
    items: [
      { name: 'Business Accounts', href: '/superadmin/business-accounts', icon: Building2 },
      { name: 'Partners', href: '/superadmin/partners', icon: Users },
    ]
  },
  {
    name: 'Products',
    isHeader: true,
    items: [
      { name: 'OS Products', href: '/superadmin/os-products', icon: Monitor },
      { name: 'Plans & Pricing', href: '/superadmin/plans', icon: Receipt },
      { name: 'Features', href: '/superadmin/master-data', icon: Database },
    ]
  },
  {
    name: 'Subscriptions',
    isHeader: true,
    items: [
      { name: 'Subscriptions', href: '/superadmin/subscriptions', icon: ArrowLeftRight },
      { name: 'Renewals', href: '/superadmin/renewals', icon: FileText },
      { name: 'Usage', href: '/superadmin/usage', icon: Activity },
    ]
  },
  {
    name: 'Finance',
    isHeader: true,
    items: [
      { name: 'Payments', href: '/superadmin/payments', icon: CreditCard },
      { name: 'Invoices', href: '/superadmin/invoices', icon: Receipt },
      { name: 'Implementation Fees', href: '/superadmin/implementation-fees', icon: Landmark },
    ]
  },
  {
    name: 'Operations',
    isHeader: true,
    items: [
      { name: 'Support Desk', href: '/superadmin/support', icon: Headset },
      { name: 'Notifications', href: '/superadmin/notifications', icon: Bell },
    ]
  },
  {
    name: 'CMS',
    isHeader: true,
    items: [
      { name: 'Website Pages', href: '/superadmin/cms/pages', icon: Globe },
      { name: 'Blog & News', href: '/superadmin/cms/blog', icon: FileText },
      { name: 'Media Library', href: '/superadmin/cms/media', icon: FileImage },
      { name: 'Landing Pages', href: '/superadmin/cms/landing', icon: LayoutTemplate },
      { name: 'Menus & Navigation', href: '/superadmin/cms/menus', icon: Share2 },
      { name: 'Banners & Promotions', href: '/superadmin/cms/banners', icon: FileImage },
      { name: 'SEO', href: '/superadmin/cms/seo', icon: Search },
    ]
  },
  {
    name: 'Reports',
    isHeader: true,
    items: [
      { name: 'Analytics', href: '/superadmin/reports/analytics', icon: Activity },
      { name: 'Revenue Reports', href: '/superadmin/reports/revenue', icon: CreditCard },
      { name: 'OS Performance', href: '/superadmin/reports/os', icon: Monitor },
    ]
  },
  {
    name: 'Security',
    isHeader: true,
    items: [
      { name: 'Audit Logs', href: '/superadmin/audit-logs', icon: FileText },
      { name: 'Access Control', href: '/superadmin/team-members', icon: Users },
    ]
  },
  {
    name: 'Platform',
    isHeader: true,
    items: [
      { name: 'Settings', href: '/superadmin/settings', icon: Settings },
    ]
  }
];

export default function SuperAdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setProfileOpen(false);
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4 shrink-0 shadow-md z-20">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 mr-3">
            HQ
          </div>
          <span className="font-bold text-white text-lg tracking-tight">ApexBuild</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-slate-300 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex w-full md:w-72 bg-slate-900 border-r border-slate-800 flex-col shrink-0 absolute md:relative z-10 h-[calc(100vh-64px)] md:h-screen transition-all shadow-2xl md:shadow-none`}>
        <div className="hidden md:flex h-16 items-center px-6 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-600/20 mr-3">
            HQ
          </div>
          <span className="font-bold text-white text-xl tracking-tight">ApexBuild HQ</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navigation.map((group, idx) => {
            if (group.isHeader) {
              return (
                <div key={idx} className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-3">
                    {group.name}
                  </h3>
                  {group.items.map(item => {
                    const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.name}
                        to={item.comingSoon ? '#' : item.href}
                        onClick={(e) => {
                          if (item.comingSoon) {
                            e.preventDefault();
                            toast('Coming in a future phase', { icon: '🚧' });
                          }
                        }}
                        className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          isActive 
                            ? 'bg-indigo-600 text-white shadow-md' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        } ${item.comingSoon ? 'opacity-60 cursor-default' : ''}`}
                      >
                        <div className="flex items-center">
                          <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                          {item.name}
                        </div>
                        {item.comingSoon && (
                          <span className="text-[10px] font-bold bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">Soon</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )
            } else {
              const isActive = location.pathname === group.href || location.pathname.startsWith(group.href + '/');
              return (
                <Link
                  key={group.name}
                  to={group.href}
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <group.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {group.name}
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Topbar */}
        <header className="hidden md:flex h-16 bg-white border-b border-slate-200 items-center justify-between px-8 shrink-0 shadow-sm z-10">
          <div className="flex items-center w-96 relative">
            <Search className="w-5 h-5 absolute left-3 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search across platform..." 
              className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-6">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-sm">
                  SA
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-bold text-slate-700">{user?.name || 'Super Admin'}</p>
                  <p className="text-xs font-medium text-slate-500">Platform Control</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
              
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1 lg:hidden">
                    <p className="text-sm font-bold text-slate-700">{user?.name || 'Super Admin'}</p>
                  </div>
                  <button onClick={handleLogoutClick} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium">
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>

      <LogoutConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </div>
  );
}
