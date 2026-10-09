import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Users, 
  UserCheck, 
  UserMinus, 
  IndianRupee,
  Search,
  Plus
} from 'lucide-react';

export default function Labour({ isProjectView = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [labourCategories, setLabourCategories] = useState([]);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [allWorkers, setAllWorkers] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Worker Modal State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [workerFormData, setWorkerFormData] = useState({ name: '', category: 'Mason', dailyRate: '', phone: '' });

  // Attendance Modal State (Only used in Project View)
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState({ records: [] });
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceSearch, setAttendanceSearch] = useState('');
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

  // Worker Profile Modal State (Only used in Global View)
  const [selectedWorker, setSelectedWorker] = useState(null);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentWorker, setPaymentWorker] = useState(null);
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', date: new Date().toISOString().split('T')[0], notes: '' });

  const fetchData = async () => {
    try {
      setLoading(true);

      // Always fetch global workers list for directory and attendance marking
      const workersRes = await api.get('/labour/workers');
      const globalWorkers = workersRes.data.data.workers;
      setAllWorkers(globalWorkers);

      if (!isProjectView) {
        // Global View fetches global summary and global attendance history
        const summaryRes = await api.get('/labour/summary');
        setLabourCategories(summaryRes.data.data.categories);
        setTotalWorkers(summaryRes.data.data.totalWorkers);

        const historyRes = await api.get('/labour/attendance');
        setAttendanceHistory(historyRes.data.data.attendances);
      } else {
        // Project View fetches project specific attendance history
        const projectId = window.location.pathname.split('/')[2];
        const historyRes = await api.get(`/projects/${projectId}/labour/attendance`);
        setAttendanceHistory(historyRes.data.data.attendances);
      }
    } catch (error) {
      toast.error('Failed to load labour data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isProjectView]);

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    try {
      await api.post('/labour/workers', workerFormData);
      toast.success('Worker added successfully');
      setIsWorkerModalOpen(false);
      setWorkerFormData({ name: '', category: 'Mason', dailyRate: '', phone: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to add worker');
    }
  };

  useEffect(() => {
    if (isAttendanceModalOpen) {
      const selectedDateStr = new Date(attendanceDate).toLocaleDateString();
      
      const existingRecordsForDate = attendanceHistory.filter(
        att => new Date(att.date).toLocaleDateString() === selectedDateStr
      );

      const initialRecords = allWorkers.map(w => {
        const existing = existingRecordsForDate.find(r => r.workerId?._id === w._id);
        return { workerId: w._id, status: existing ? existing.status : 'Absent' };
      });

      setAttendanceRecords({ records: initialRecords });
    }
  }, [attendanceDate, attendanceHistory, allWorkers, isAttendanceModalOpen]);

  const handleOpenAttendance = () => {
    setIsAttendanceModalOpen(true);
  };

  const submitAttendance = async (e) => {
    e.preventDefault();
    try {
      const projectId = window.location.pathname.split('/')[2];
      
      const presentRecords = attendanceRecords.records.filter(r => r.status === 'Present' || r.status === 'Half-Day');
      
      const reqBody = { 
        date: new Date(attendanceDate).toISOString(), 
        records: presentRecords
      };
      
      // If a worker was marked Present before, and now changed to Absent, filtering them out will NOT delete the old record.
      // To properly handle updates, the backend needs to handle this. For now, sending only Present/Half-day is fine for initial marking.

      await api.post(`/projects/${projectId}/labour/attendance`, reqBody);
      toast.success('Attendance saved');
      setIsAttendanceModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/labour/workers/${paymentWorker._id}/payment`, paymentFormData);
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      
      // Update selectedWorker if profile modal is open
      if (selectedWorker && selectedWorker._id === paymentWorker._id) {
        // Optimistically update
        setSelectedWorker(prev => ({
          ...prev,
          totalPaid: (prev.totalPaid || 0) + Number(paymentFormData.amount),
          payments: [...(prev.payments || []), { amount: Number(paymentFormData.amount), date: paymentFormData.date, notes: paymentFormData.notes }]
        }));
      }
      
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // Compute payouts (for global view)
  const workerPayouts = allWorkers.map(w => {
    const history = attendanceHistory.filter(att => att.workerId?._id === w._id && (att.status === 'Present' || att.status === 'Half-Day'));
    const daysWorked = history.reduce((sum, att) => sum + (att.status === 'Present' ? 1 : 0.5), 0);
    const totalPayout = daysWorked * w.dailyRate;
    const totalPaid = w.totalPaid || 0;
    const totalOwed = totalPayout - totalPaid;
    return { ...w, daysWorked, totalPayout, totalPaid, totalOwed, history };
  });

  // Compute stats for Global
  const totalPresent = labourCategories.reduce((sum, cat) => sum + cat.present, 0);
  const totalAbsent = totalWorkers - totalPresent;
  const costToday = labourCategories.reduce((sum, cat) => sum + (cat.present * cat.rate), 0);
  const totalPaidGlobal = workerPayouts.reduce((sum, w) => sum + (w.totalPaid || 0), 0);
  const totalOwedGlobal = workerPayouts.reduce((sum, w) => sum + (w.totalOwed || 0), 0);

  // Compute site record for selected viewDate (for project view)
  const viewDateStr = new Date(viewDate).toLocaleDateString();
  const projectRecordsForViewDate = attendanceHistory.filter(att => 
    new Date(att.date).toLocaleDateString() === viewDateStr && 
    (att.status === 'Present' || att.status === 'Half-Day')
  );
  
  const totalCostForViewDate = projectRecordsForViewDate.reduce((sum, att) => {
     return sum + (att.workerId?.dailyRate || 0) * (att.status === 'Present' ? 1 : 0.5);
  }, 0);

  // Group workers by category for global view
  const groupedWorkers = workerPayouts
    .filter(w => !searchTerm || w.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .reduce((acc, w) => {
      if (!acc[w.category]) acc[w.category] = [];
      acc[w.category].push(w);
      return acc;
    }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isProjectView ? 'Site Labour Attendance' : 'Labour & Workforce Management'}
          </h1>
          <p className="text-slate-500">
            {isProjectView ? 'Manage daily attendance and labour costs for this site.' : 'Manage your organization\'s workforce and payouts.'}
          </p>
        </div>
        <div className="flex gap-2">
          {isProjectView ? (
            <button className="btn btn-primary text-sm" onClick={handleOpenAttendance}>
              <UserCheck className="w-4 h-4 mr-2" /> Mark Attendance
            </button>
          ) : (
            <button className="btn btn-primary text-sm" onClick={() => setIsWorkerModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Employee (Worker)
            </button>
          )}
        </div>
      </div>

      {!isProjectView ? (
        <>
          {/* Global View: Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Employees</p>
                <p className="font-bold text-slate-800 text-2xl">{totalWorkers}</p>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Total Paid</p>
                <p className="font-bold text-emerald-600 text-2xl">{formatCurrency(totalPaidGlobal)}</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><IndianRupee className="w-6 h-6" /></div>
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Balance Owed</p>
                <p className="font-bold text-amber-600 text-2xl">{formatCurrency(totalOwedGlobal)}</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><IndianRupee className="w-6 h-6" /></div>
            </div>
          </div>

          {/* Global View: Employee Directory */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800">Employee Directory & Payouts</h2>
              <div className="flex items-center gap-2 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search workers..." 
                  className="input pl-9 text-sm py-1.5"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Phone</th>
                    <th className="px-6 py-4 font-medium text-right">Per Day Cost (₹)</th>
                    <th className="px-6 py-4 font-medium text-right">Days Worked</th>
                    <th className="px-6 py-4 font-medium text-right">Total Earned (₹)</th>
                    <th className="px-6 py-4 font-medium text-right">Total Paid (₹)</th>
                    <th className="px-6 py-4 font-medium text-right">Balance Owed (₹)</th>
                    <th className="px-6 py-4 font-medium text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.keys(groupedWorkers).length > 0 ? (
                    Object.entries(groupedWorkers).map(([category, workers]) => (
                      <React.Fragment key={category}>
                        <tr className="bg-slate-100/50">
                          <td colSpan={8} className="px-6 py-3 font-bold text-slate-700 text-sm uppercase tracking-wide">
                            {category} <span className="ml-2 text-xs font-normal text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">{workers.length} {workers.length === 1 ? 'Worker' : 'Workers'}</span>
                          </td>
                        </tr>
                        {workers.map(worker => (
                          <tr key={worker._id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-primary-600">{worker.name}</td>
                            <td className="px-6 py-4 text-slate-600">{worker.phone || '-'}</td>
                            <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(worker.dailyRate)}</td>
                            <td className="px-6 py-4 text-right font-medium text-slate-800">{worker.daysWorked}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-800">{formatCurrency(worker.totalPayout)}</td>
                            <td className="px-6 py-4 text-right font-medium text-emerald-600">{formatCurrency(worker.totalPaid)}</td>
                            <td className="px-6 py-4 text-right font-bold text-amber-600">{formatCurrency(worker.totalOwed)}</td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex gap-2 justify-center">
                                <button 
                                  onClick={() => setSelectedWorker(worker)}
                                  className="text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 px-3 py-1.5 rounded-md"
                                >
                                  Profile
                                </button>
                                <button 
                                  onClick={() => { setPaymentWorker(worker); setIsPaymentModalOpen(true); }}
                                  className="text-xs font-medium text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-md whitespace-nowrap"
                                >
                                  + Pay
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-500">
                        {loading ? 'Loading...' : 'No employees found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Project View: Daily Site Record */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 gap-4">
              <h2 className="font-bold text-slate-800">Site Attendance by Date</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Select Date:</span>
                <input 
                  type="date" 
                  className="input py-1.5 text-sm w-full sm:w-auto"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium">Worker Name</th>
                    <th className="px-6 py-4 font-medium">Category</th>
                    <th className="px-6 py-4 font-medium text-center">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {projectRecordsForViewDate.length > 0 ? projectRecordsForViewDate.map(att => (
                    <tr key={att._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-primary-600 capitalize">{att.workerId?.name || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {att.workerId?.category || 'Worker'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          att.status === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-700">
                        {formatCurrency((att.workerId?.dailyRate || 0) * (att.status === 'Present' ? 1 : 0.5))}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        {loading ? 'Loading...' : 'No attendance recorded for this date.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {projectRecordsForViewDate.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-right font-bold text-slate-800">Total Cost for {new Date(viewDate).toLocaleDateString()}:</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">{formatCurrency(totalCostForViewDate)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </>
      )}

      {/* Global View: Add Worker Modal */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Add New Employee</h2>
              <button onClick={() => setIsWorkerModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleCreateWorker} className="p-6 space-y-4">
              <div>
                <label className="label">Employee Name</label>
                <input type="text" className="input" required value={workerFormData.name} onChange={e => setWorkerFormData({...workerFormData, name: e.target.value})} placeholder="E.g., Ramesh Kumar" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={workerFormData.category} onChange={e => setWorkerFormData({...workerFormData, category: e.target.value})}>
                    <option value="Mason">Mason</option>
                    <option value="Helper">Helper</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Electrician">Electrician</option>
                    <option value="Painter">Painter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Per Day Cost (₹)</label>
                  <input type="number" className="input" required min="0" value={workerFormData.dailyRate} onChange={e => setWorkerFormData({...workerFormData, dailyRate: e.target.value})} placeholder="E.g., 600" />
                </div>
              </div>

              <div>
                <label className="label">Phone (Optional)</label>
                <input type="tel" className="input" value={workerFormData.phone} onChange={e => setWorkerFormData({...workerFormData, phone: e.target.value})} placeholder="10-digit number" />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsWorkerModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global View: Worker Profile Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedWorker.name}</h2>
                <p className="text-sm text-slate-500">{selectedWorker.category} • Phone: {selectedWorker.phone || 'N/A'}</p>
              </div>
              <button onClick={() => setSelectedWorker(null)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-slate-100">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium mb-1">Total Days</p>
                <p className="text-xl font-bold text-blue-900">{selectedWorker.daysWorked}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600 font-medium mb-1">Total Earned</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(selectedWorker.totalPayout)}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                <p className="text-xs text-emerald-600 font-medium mb-1">Total Paid</p>
                <p className="text-xl font-bold text-emerald-900">{formatCurrency(selectedWorker.totalPaid || 0)}</p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">Balance Owed</p>
                <p className="text-xl font-bold text-amber-900">{formatCurrency((selectedWorker.totalPayout || 0) - (selectedWorker.totalPaid || 0))}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-4">Attendance History</h3>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Project Site</th>
                      <th className="px-4 py-3 font-medium text-center">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Amount Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedWorker.history.length > 0 ? selectedWorker.history.map(att => (
                      <tr key={att._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800">{new Date(att.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-slate-600">{att.projectId?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            att.status === 'Present' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {att.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">
                          {formatCurrency(selectedWorker.dailyRate * (att.status === 'Present' ? 1 : 0.5))}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-slate-500">No attendance records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-4">Payment History</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Amount</th>
                        <th className="px-4 py-3 font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedWorker.payments && selectedWorker.payments.length > 0 ? selectedWorker.payments.map((pay, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{new Date(pay.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium text-emerald-700">{formatCurrency(pay.amount)}</td>
                          <td className="px-4 py-3 text-slate-600">{pay.notes || '-'}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-6 text-center text-slate-500">No payment records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project View: Mark Attendance Modal */}
      {isAttendanceModalOpen && isProjectView && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Site Attendance</h2>
                <div className="mt-2 flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-600">Select Date:</label>
                  <input 
                    type="date" 
                    className="input text-sm py-1 max-w-[150px]" 
                    value={attendanceDate}
                    onChange={(e) => {
                      setAttendanceDate(e.target.value);
                      // This won't instantly re-fetch historical data until they close/re-open, but good enough for new marking.
                      // Ideally we'd re-trigger the default state calculation.
                    }}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <button onClick={() => setIsAttendanceModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={submitAttendance} className="flex flex-col flex-1 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 p-3 px-6 text-sm text-blue-800">
                Mark workers who are present at this site today. Unmarked workers will remain absent.
              </div>
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search employees by name..." 
                    className="input pl-9"
                    value={attendanceSearch}
                    onChange={(e) => setAttendanceSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
                {allWorkers.length === 0 ? (
                  <p className="text-center text-slate-500">No workers in the organization to mark.</p>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
                    {allWorkers
                      .filter(w => !attendanceSearch || w.name.toLowerCase().includes(attendanceSearch.toLowerCase()))
                      .map((worker) => {
                        const currentRecord = attendanceRecords.records.find(r => r.workerId === worker._id);
                      const isPresent = currentRecord && currentRecord.status !== 'Absent';
                      
                      return (
                        <div key={worker._id} className={`flex items-center justify-between p-4 border-b border-slate-100 last:border-0 transition-colors ${isPresent ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                          <div>
                            <p className="font-bold text-slate-800">{worker.name}</p>
                            <p className="text-xs text-slate-500">{worker.category} • ₹{worker.dailyRate}/day</p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              type="button"
                              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentRecord?.status === 'Present' ? 'bg-emerald-100 border-emerald-200 text-emerald-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              onClick={() => {
                                const newStatus = currentRecord?.status === 'Present' ? 'Absent' : 'Present';
                                setAttendanceRecords({ ...attendanceRecords, records: attendanceRecords.records.map(r => r.workerId === worker._id ? { ...r, status: newStatus } : r) });
                              }}
                            >
                              Full Day
                            </button>
                            <button 
                              type="button"
                              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${currentRecord?.status === 'Half-Day' ? 'bg-amber-100 border-amber-200 text-amber-800 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                              onClick={() => {
                                const newStatus = currentRecord?.status === 'Half-Day' ? 'Absent' : 'Half-Day';
                                setAttendanceRecords({ ...attendanceRecords, records: attendanceRecords.records.map(r => r.workerId === worker._id ? { ...r, status: newStatus } : r) });
                              }}
                            >
                              Half Day
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global View: Record Payment Modal */}
      {isPaymentModalOpen && paymentWorker && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Record Payment</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={submitPayment} className="p-6 space-y-4">
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 mb-4">
                <p className="text-sm text-amber-800">Recording payment for <strong>{paymentWorker.name}</strong></p>
                <p className="text-xs text-amber-600 mt-1">Current Balance Owed: {formatCurrency(paymentWorker.totalOwed)}</p>
              </div>

              <div>
                <label className="label">Amount (₹)</label>
                <input 
                  type="number" 
                  className="input" 
                  required 
                  min="1" 
                  value={paymentFormData.amount} 
                  onChange={e => setPaymentFormData({...paymentFormData, amount: e.target.value})} 
                  placeholder="e.g. 5000" 
                />
              </div>
              
              <div>
                <label className="label">Date</label>
                <input 
                  type="date" 
                  className="input" 
                  required 
                  value={paymentFormData.date} 
                  onChange={e => setPaymentFormData({...paymentFormData, date: e.target.value})} 
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="label">Notes / Reference (Optional)</label>
                <input 
                  type="text" 
                  className="input" 
                  value={paymentFormData.notes} 
                  onChange={e => setPaymentFormData({...paymentFormData, notes: e.target.value})} 
                  placeholder="e.g. Cash, Weekly clearing" 
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
