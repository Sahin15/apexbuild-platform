import { useState, useEffect } from 'react';
import { 
  Building2, Users, DollarSign, Activity, AlertTriangle, 
  CheckCircle2, Clock, Monitor, RefreshCw, XCircle, CreditCard, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Link } from 'react-router-dom';

export default function SuperadminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/dashboard');
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load platform dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const KpiCard = ({ title, value, subtitle, icon: Icon, colorClass, borderClass }) => (
    <div className={`bg-white rounded-2xl p-6 shadow-sm border ${borderClass} relative overflow-hidden group hover:shadow-md transition-shadow`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-sm font-semibold mb-1">{title}</p>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h2>
          {subtitle && <p className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const map = {
      'active': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active' },
      'pending': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
      'payment_pending': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Payment Due' },
      'restricted': { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Restricted' },
      'suspended': { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
      'inactive': { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Inactive' },
    };
    const s = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', label: status };
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${s.bg} ${s.text}`}>
        {s.label}
      </span>
    );
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const { kpi, osAdoption, recentAccounts, pendingApprovalsQueue, paymentVerificationQueue } = data;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Overview</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Real-time pulse of the ApexBuild ecosystem.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchDashboardData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <Link to="/superadmin/business-accounts?new=true" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
            + New Account
          </Link>
        </div>
      </div>

      {/* Attention Required */}
      {(kpi.pendingApprovals > 0 || kpi.paymentPending > 0 || kpi.restrictedAccounts > 0) && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-full text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-rose-900">Attention Required</h3>
              <p className="text-sm text-rose-700 font-medium mt-0.5">
                {kpi.pendingApprovals > 0 && <span>{kpi.pendingApprovals} pending approvals. </span>}
                {kpi.paymentPending > 0 && <span>{kpi.paymentPending} payments awaiting verification. </span>}
                {kpi.restrictedAccounts > 0 && <span>{kpi.restrictedAccounts} restricted accounts. </span>}
              </p>
            </div>
          </div>
          <Link to="/superadmin/business-accounts?status=pending" className="shrink-0 px-4 py-2 bg-white border border-rose-200 text-rose-700 font-bold rounded-lg shadow-sm hover:bg-rose-50 transition-colors text-sm">
            Review Queue
          </Link>
        </div>
      )}

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Businesses" value={kpi.totalBusinesses} subtitle={`${kpi.newBusinessesThisMonth} new this month`} icon={Building2} colorClass="bg-blue-50 text-blue-600" borderClass="border-slate-200" />
        <KpiCard title="Active Businesses" value={kpi.activeBusinesses} subtitle={`${Math.round((kpi.activeBusinesses/Math.max(1,kpi.totalBusinesses))*100)}% adoption rate`} icon={CheckCircle2} colorClass="bg-emerald-50 text-emerald-600" borderClass="border-slate-200" />
        <KpiCard title="Pending Approvals" value={kpi.pendingApprovals} subtitle="Requires manual review" icon={Clock} colorClass="bg-amber-50 text-amber-600" borderClass={kpi.pendingApprovals > 0 ? "border-amber-300" : "border-slate-200"} />
        <KpiCard title="Payment Pending" value={kpi.paymentPending} subtitle="Awaiting clearing" icon={CreditCard} colorClass="bg-rose-50 text-rose-600" borderClass={kpi.paymentPending > 0 ? "border-rose-300" : "border-slate-200"} />
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue (ARR)" value={`₹${kpi.totalRevenue.toLocaleString()}`} subtitle="Annual run rate" icon={DollarSign} colorClass="bg-indigo-50 text-indigo-600" borderClass="border-slate-200" />
        <KpiCard title="Monthly Recurring" value={`₹${kpi.mrr.toLocaleString()}`} subtitle="Active subscriptions" icon={Activity} colorClass="bg-indigo-50 text-indigo-600" borderClass="border-slate-200" />
        <KpiCard title="Active Subscriptions" value={kpi.activeSubscriptions} subtitle="Across all OS products" icon={Monitor} colorClass="bg-slate-100 text-slate-600" borderClass="border-slate-200" />
        <KpiCard title="Outstanding Payments" value={`₹${kpi.outstandingPayments.toLocaleString()}`} subtitle="Invoiced but not paid" icon={AlertTriangle} colorClass="bg-slate-100 text-slate-600" borderClass="border-slate-200" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* OS Adoption List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm col-span-1 lg:col-span-1">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">OS Adoption</h2>
            <Monitor className="w-5 h-5 text-slate-400" />
          </div>
          <div className="p-5 space-y-5">
            {osAdoption.sort((a,b) => b.businesses - a.businesses).map(os => (
              <div key={os.businessType}>
                <div className="flex justify-between text-sm font-semibold mb-1">
                  <span className="text-slate-700">{os.osName}</span>
                  <span className="text-slate-900">{os.businesses} <span className="text-slate-400 font-medium text-xs ml-1">accounts</span></span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${os.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Secondary Stats */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
             <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
             <div className="space-y-3">
               {[
                 { name: 'Review Approvals', desc: `${kpi.pendingApprovals} awaiting` },
                 { name: 'View Payments', desc: 'Verify incoming transfers' },
                 { name: 'Manage Subscriptions', desc: 'View expiring plans' },
                 { name: 'OS Products', desc: 'Configure pricing & features' }
               ].map(action => (
                 <Link 
                   key={action.name} 
                   to="#" 
                   onClick={(e) => { e.preventDefault(); toast('Coming in future phase', { icon: '🚧' }) }}
                   className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-colors group"
                 >
                   <div>
                     <p className="font-bold text-slate-800 text-sm group-hover:text-indigo-700 transition-colors">{action.name}</p>
                     <p className="text-xs text-slate-500 font-medium">{action.desc}</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                 </Link>
               ))}
             </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
             <h2 className="text-lg font-bold text-slate-800 mb-4">Risk Factors</h2>
             <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-sm font-semibold text-slate-600">Restricted Accounts</span>
                  </div>
                  <span className="font-black text-slate-800">{kpi.restrictedAccounts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-sm font-semibold text-slate-600">Suspended Accounts</span>
                  </div>
                  <span className="font-black text-slate-800">{kpi.suspendedAccounts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span className="text-sm font-semibold text-slate-600">Renewals Due (30d)</span>
                  </div>
                  <span className="font-black text-slate-800">{kpi.renewalsDueSoon}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pending Approvals</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Businesses waiting to use the platform</p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            {pendingApprovalsQueue.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex p-3 rounded-full bg-slate-50 mb-3"><CheckCircle2 className="w-6 h-6 text-slate-300" /></div>
                <p className="text-slate-500 font-medium text-sm">No businesses awaiting approval.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Requested OS</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pendingApprovalsQueue.map(org => (
                    <tr key={org.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3">
                        <p className="font-bold text-slate-800">{org.name}</p>
                        <p className="text-xs text-slate-500">{org.owner}</p>
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-600">
                        {org.requestedOs}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link to="#" onClick={(e) => { e.preventDefault(); toast('Coming in future phase', { icon: '🚧' }) }} className="text-indigo-600 font-bold hover:text-indigo-800 text-xs bg-indigo-50 px-3 py-1.5 rounded-lg">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payment Verification Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Payment Verification</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Manual payments waiting for clearing</p>
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            {paymentVerificationQueue.length === 0 ? (
              <div className="p-8 text-center">
                <div className="inline-flex p-3 rounded-full bg-slate-50 mb-3"><CheckCircle2 className="w-6 h-6 text-slate-300" /></div>
                <p className="text-slate-500 font-medium text-sm">No payment verifications pending.</p>
                <p className="text-xs text-slate-400 mt-1">Data will appear once payment module is active.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/50 text-slate-500 font-semibold">
                  <tr>
                    <th className="px-5 py-3">Business</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentVerificationQueue.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-bold text-slate-800">{p.businessName}</td>
                      <td className="px-5 py-3 font-bold text-slate-600">₹{p.amount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right">
                        <Link to="#" onClick={(e) => { e.preventDefault(); toast('Coming in future phase', { icon: '🚧' }) }} className="text-indigo-600 font-bold hover:text-indigo-800 text-xs bg-indigo-50 px-3 py-1.5 rounded-lg">Verify</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Businesses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Recent Registrations</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Latest businesses added to ApexBuild</p>
          </div>
          <Link to="#" onClick={(e) => { e.preventDefault(); toast('Coming in future phase', { icon: '🚧' }) }} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold">
              <tr>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">OS Product</th>
                <th className="px-6 py-4">Registered</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAccounts.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{org.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{org.owner}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{org.osName}</td>
                  <td className="px-6 py-4 text-slate-500 font-medium">{new Date(org.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={org.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to="#" onClick={(e) => { e.preventDefault(); toast('Coming in future phase', { icon: '🚧' }) }} className="text-slate-400 hover:text-indigo-600 font-semibold transition-colors">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
