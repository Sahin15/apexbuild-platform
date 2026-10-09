import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar,
  MapPin,
  User,
  Eye,
  FileText
} from 'lucide-react';

export default function SiteReports({ isProjectView }) {
  const { id: projectId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [reports, setReports] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    reportDate: new Date().toISOString().split('T')[0],
    weather: 'Sunny',
    workCompleted: '',
    nextDayPlan: '',
    issues: '',
    status: 'SUBMITTED'
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint = (isProjectView && projectId) ? `/projects/${projectId}/site-reports` : '/site-reports';
      const res = await api.get(endpoint);
      setReports(res.data.data.reports || []);
    } catch (error) {
      toast.error('Failed to load site reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!isProjectView) {
      try {
        const res = await api.get('/projects');
        setProjects(res.data.data.projects);
      } catch (error) {
        console.error('Failed to load projects');
      }
    }
  };

  useEffect(() => {
    fetchReports();
    fetchProjects();
  }, [projectId, isProjectView]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, projectId: isProjectView ? projectId : formData.projectId };
      if (!payload.projectId) return toast.error('Please select a project');
      
      await api.post(isProjectView ? `/projects/${projectId}/site-reports` : '/site-reports', payload);
      toast.success('DPR submitted successfully');
      setIsModalOpen(false);
      setFormData({ ...formData, workCompleted: '', nextDayPlan: '', issues: '' });
      fetchReports();
    } catch (error) {
      toast.error('Failed to submit DPR');
    }
  };

  const handleApprove = async (reportId) => {
    try {
      await api.post(`/site-reports/${reportId}/approve`);
      toast.success('Report approved successfully');
      setIsViewModalOpen(false);
      fetchReports();
    } catch (error) {
      toast.error('Failed to approve report');
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  if (loading && isProjectView) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading reports...</div>;
  }

  return (
    <div className={isProjectView ? "" : "space-y-6"}>
      {!isProjectView && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Site Reports (DPR)</h1>
            <p className="text-slate-500">Monitor daily progress, labour, and materials across sites.</p>
          </div>
          <button className="btn btn-primary text-sm flex items-center" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create DPR
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className={`bg-white p-4 rounded-t-lg border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center ${isProjectView ? 'rounded-lg border shadow-sm mb-4' : 'shadow-sm border'}`}>
        <div className="flex-1 w-full max-w-md relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search reports by project or engineer..." 
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-md border border-slate-200">
            <Calendar className="w-4 h-4" />
            <span>Last 7 Days</span>
          </div>
          <button className="btn btn-secondary flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4" /> Filter
          </button>
          {isProjectView && (
            <button className="btn btn-primary text-sm flex items-center" onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Create DPR
            </button>
          )}
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Engineer</th>
                <th className="px-6 py-4 font-medium">Progress Summary</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No site reports found.
                  </td>
                </tr>
              ) : (
                Object.entries(reports.reduce((acc, report) => {
                  const pName = isProjectView ? 'hidden' : (report.project?.name || 'Unknown Project');
                  if (!acc[pName]) acc[pName] = [];
                  acc[pName].push(report);
                  return acc;
                }, {})).map(([pName, pReports]) => (
                  <React.Fragment key={pName}>
                    {pName !== 'hidden' && (
                      <tr className="bg-slate-50/50">
                        <td colSpan={5} className="px-6 py-3 font-bold text-slate-700 border-y border-slate-200 shadow-sm">
                          {pName}
                        </td>
                      </tr>
                    )}
                    {pReports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => openViewModal(report)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 font-medium text-slate-800">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {new Date(report.reportDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-600">
                            <User className="w-4 h-4 text-slate-400" />
                            {report.siteEngineerId?.name || 'Engineer'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                          {report.workCompleted || report.nextDayPlan || 'Report details attached...'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            report.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            report.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center justify-end w-full gap-1"
                            onClick={(e) => { e.stopPropagation(); openViewModal(report); }}
                          >
                            <Eye className="w-4 h-4" /> View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create DPR Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Submit Daily Progress Report (DPR)</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {!isProjectView && (
                  <div>
                    <label className="label">Project <span className="text-red-500">*</span></label>
                    <select 
                      className="input" 
                      required 
                      value={formData.projectId}
                      onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Report Date <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="input" 
                      required 
                      value={formData.reportDate}
                      onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="label">Weather Conditions</label>
                    <select 
                      className="input"
                      value={formData.weather}
                      onChange={(e) => setFormData({...formData, weather: e.target.value})}
                    >
                      <option>Sunny</option>
                      <option>Cloudy</option>
                      <option>Rainy</option>
                      <option>Stormy</option>
                      <option>Extreme Heat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Work Completed Today <span className="text-red-500">*</span></label>
                  <textarea 
                    className="input min-h-[100px]" 
                    required 
                    placeholder="Describe tasks completed, e.g. 'Poured 50 cubic meters of concrete for foundation...'"
                    value={formData.workCompleted}
                    onChange={(e) => setFormData({...formData, workCompleted: e.target.value})}
                  ></textarea>
                </div>
                
                <div>
                  <label className="label">Next Day Plan</label>
                  <textarea 
                    className="input min-h-[80px]" 
                    placeholder="What is planned for tomorrow?"
                    value={formData.nextDayPlan}
                    onChange={(e) => setFormData({...formData, nextDayPlan: e.target.value})}
                  ></textarea>
                </div>

                <div>
                  <label className="label">Issues / Delays (Optional)</label>
                  <textarea 
                    className="input" 
                    placeholder="Any site issues, material shortages, or weather delays?"
                    value={formData.issues}
                    onChange={(e) => setFormData({...formData, issues: e.target.value})}
                  ></textarea>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit DPR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View DPR Modal */}
      {isViewModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Daily Progress Report</h2>
                <p className="text-sm text-slate-500">
                  {new Date(selectedReport.reportDate).toLocaleDateString()} • {selectedReport.project?.name}
                </p>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    selectedReport.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    selectedReport.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Engineer</p>
                  <p className="font-medium text-slate-800">{selectedReport.siteEngineerId?.name || 'Unknown'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Weather</p>
                  <p className="font-medium text-slate-800">{selectedReport.weather || 'N/A'}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Submitted On</p>
                  <p className="font-medium text-slate-800">{new Date(selectedReport.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" /> Work Completed Today
                </h3>
                <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {selectedReport.workCompleted || 'No details provided.'}
                </p>
              </div>

              {selectedReport.nextDayPlan && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" /> Next Day Plan
                  </h3>
                  <p className="text-slate-600 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {selectedReport.nextDayPlan}
                  </p>
                </div>
              )}

              {selectedReport.issues && (
                <div>
                  <h3 className="font-bold text-amber-600 mb-2 border-b border-slate-100 pb-2">Issues & Delays</h3>
                  <p className="text-slate-600 whitespace-pre-wrap bg-amber-50 p-4 rounded-lg border border-amber-100">
                    {selectedReport.issues}
                  </p>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button type="button" className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
              {selectedReport.status !== 'APPROVED' && (
                <button type="button" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500" onClick={() => handleApprove(selectedReport._id)}>
                  Approve Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
