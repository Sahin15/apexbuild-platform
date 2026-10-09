import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Package, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <span className="text-slate-900 text-xl font-bold tracking-tight">ApexBuild</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium text-sm">
                Log In
              </Link>
              <Link to="/register" className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              One platform. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-600">
                Every vertical.
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Whether you are a construction contractor managing sites, or a material supplier handling heavy inventory, ApexBuild gives you the specialized tools to control your business.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#solutions" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center">
                Explore Solutions
              </a>
            </div>
          </div>
        </div>

        {/* Vertical Solutions */}
        <div id="solutions" className="bg-white py-24 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Tailored for your industry</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">ApexBuild isn't a generic tool. You choose your business vertical during signup and get a completely tailored experience.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              
              {/* Contractor Card */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:shadow-primary-900/5 transition-all group">
                <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Contractor Cloud</h3>
                <p className="text-slate-600 mb-6 line-clamp-3">
                  Purpose-built for construction companies. Manage projects, estimate BOQs, track site reports, monitor labor attendance, and handle complex RA billing all in one place.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Real-time Site Reports', 'Automated RA Billing', 'Labor & Attendance Tracking', 'Project Profitability'].map((f, i) => (
                    <li key={i} className="flex items-center text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Supplier Card */}
              <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all group">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Package className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Supplier Hub</h3>
                <p className="text-slate-600 mb-6 line-clamp-3">
                  Designed for material suppliers and hardware traders. Track incoming purchases, fulfill sales orders, and maintain strict control over your multi-warehouse inventory.
                </p>
                <ul className="space-y-3 mb-8">
                  {['Automated Inventory Ledger', 'Purchase & Sales Orders', 'Vendor Payable Tracking', 'Live Stock Valuation'].map((f, i) => (
                    <li key={i} className="flex items-center text-sm text-slate-700 font-medium">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3" /> {f}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        </div>
      </main>

      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-slate-900 font-bold text-lg">
              A
            </div>
            <span className="text-white text-xl font-bold tracking-tight">ApexBuild</span>
          </div>
          <p className="text-slate-400 text-sm">© {new Date().getFullYear()} ApexBuild Technologies. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
