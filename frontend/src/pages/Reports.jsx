import { useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [reportTitle, setReportTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reportsList = [
    { id: 'project-cost', title: 'Project Cost Report', desc: 'Detailed breakdown of expenses vs budget per project.' },
    { id: 'profitability', title: 'Profitability Report', desc: 'High-level margin and profit analysis.' },
    { id: 'ra-billing', title: 'RA Billing Summary', desc: 'Overview of all generated and pending RA bills.' },
  ];

  const handleGenerateReport = async (report) => {
    try {
      setLoading(true);
      const res = await api.get(`/reports/${report.id}`);
      setReportData(res.data.data.report);
      setReportTitle(report.title);
      setIsModalOpen(true);
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData || reportData.length === 0) return;
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Reports & Analytics</h1>
        <p className="text-slate-500">Generate insights and export data for your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportsList.map((r, i) => (
          <div key={i} className="card p-5 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary-500 group" onClick={() => handleGenerateReport(r)}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{r.title}</h3>
              <FileText className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
            </div>
            <p className="text-sm text-slate-600 mb-4">{r.desc}</p>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Report →'}
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-6xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">{reportTitle}</h2>
              <div className="flex items-center gap-4">
                <button 
                  onClick={downloadCSV}
                  className="btn btn-primary text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </button>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
              {reportData && reportData.length > 0 ? (
                <div className="card overflow-x-auto shadow-sm">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                      <tr>
                        {Object.keys(reportData[0]).map(header => (
                          <th key={header} className="px-6 py-4 font-semibold">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {reportData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          {Object.values(row).map((val, cellIdx) => (
                            <td key={cellIdx} className="px-6 py-4 text-slate-700">
                              {typeof val === 'number' && val > 1000 ? `₹${val.toLocaleString()}` : val}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-white rounded-lg border border-slate-200">
                  No data available for this report.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
