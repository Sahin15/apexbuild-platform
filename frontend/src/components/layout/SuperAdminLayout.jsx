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
import Header from './Header';
import SidebarUserProfile from './SidebarUserProfile';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 p-4 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-md shadow-indigo-600/30 text-xs">
            SA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-none">ApexBuild</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">Superadmin Console</span>
          </div>
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
        <div className="hidden md:flex h-16 items-center gap-3 px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white shadow-md shadow-indigo-600/30 text-xs">
            SA
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-white text-base tracking-tight leading-none">ApexBuild</span>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mt-0.5">Superadmin Console</span>
          </div>
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

        {/* Unified Bottom User Profile */}
        <SidebarUserProfile />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F8FAFC]">
        {/* Unified Topbar */}
        <Header setSidebarOpen={setMobileMenuOpen} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
