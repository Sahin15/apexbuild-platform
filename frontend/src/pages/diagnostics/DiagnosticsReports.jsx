import { useState, useEffect } from 'react';
import { Search, Filter, FileText, CheckCircle, Download, FileCheck, Award, Printer } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../../context/AuthContext';

const DiagnosticsReports = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderResults, setOrderResults] = useState([]);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/orders');
      // Only show orders that have results (Partial Results or Completed)
      const reportableOrders = res.data.data.orders.filter(
        o => ['Partial Results', 'Completed'].includes(o.orderStatus)
      );
      setOrders(reportableOrders);
    } catch (error) {
      toast.error('Failed to load reports');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReport = async (order) => {
    setSelectedOrder(order);
    try {
      setIsVerifying(true);
      const res = await api.get(`/diagnostics/results/order/${order._id}`);
      setOrderResults(res.data.data.results);
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyResult = async (resultId) => {
    try {
      await api.patch(`/diagnostics/results/${resultId}/verify`);
      toast.success('Result Verified!');
      
      // Refresh modal data
      const res = await api.get(`/diagnostics/results/order/${selectedOrder._id}`);
      setOrderResults(res.data.data.results);
      fetchOrders(); // update background list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify');
    }
  };

  const generatePDF = (order, results) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.setFont("helvetica", "bold");
    doc.text("APEX DIAGNOSTICS", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("123 Health Avenue, Medical District, City - 400001", 105, 26, { align: "center" });
    doc.text("Ph: +91-9876543210 | Email: reports@apexdiagnostics.com", 105, 31, { align: "center" });
    
    doc.line(14, 35, 196, 35); // Horizontal line

    // Patient Info Box
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Patient Name:", 14, 45);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.patient?.firstName} ${order.patient?.lastName}`, 45, 45);
    
    doc.setFont("helvetica", "bold");
    doc.text("Age / Sex:", 14, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.patient?.age || '-'} Yrs / ${order.patient?.gender || '-'}`, 45, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Referred By:", 14, 59);
    doc.setFont("helvetica", "normal");
    doc.text(order.referringDoctor?.name || 'Self', 45, 59);

    // Right column Info
    doc.setFont("helvetica", "bold");
    doc.text("Report ID:", 130, 45);
    doc.setFont("helvetica", "normal");
    doc.text(order.orderId, 160, 45);

    doc.setFont("helvetica", "bold");
    doc.text("Registered:", 130, 52);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(order.createdAt).toLocaleDateString(), 160, 52);

    doc.setFont("helvetica", "bold");
    doc.text("Status:", 130, 59);
    doc.setFont("helvetica", "normal");
    doc.text(order.orderStatus === 'Completed' ? 'FINAL' : 'PARTIAL', 160, 59);

    doc.setDrawColor(200, 200, 200);
    doc.rect(12, 38, 186, 26); // Box around patient info

    // Tests & Results Table
    let startY = 75;

    results.forEach((result, idx) => {
      // Test Title
      doc.setFontSize(12);
      doc.setTextColor(30, 64, 175);
      doc.setFont("helvetica", "bold");
      doc.text(result.test.name.toUpperCase(), 14, startY);
      
      const tableData = result.parameters.map(p => [
        p.name,
        p.isAbnormal ? `* ${p.value}` : p.value,
        p.unit || '',
        p.referenceRange || ''
      ]);

      doc.autoTable({
        startY: startY + 5,
        head: [['Investigation', 'Result', 'Unit', 'Bio. Ref. Interval']],
        body: tableData,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        headStyles: { fontStyle: 'bold', textColor: [100, 100, 100], borderBottomWidth: 0.5, borderBottomColor: [200, 200, 200] },
        willDrawCell: function (data) {
          if (data.section === 'body' && data.column.index === 1) {
            // Highlight abnormal values in red
            const isAbnormal = result.parameters[data.row.index]?.isAbnormal;
            if (isAbnormal) {
              doc.setTextColor(220, 38, 38);
              doc.setFont("helvetica", "bold");
            }
          }
        },
      });

      startY = doc.lastAutoTable.finalY + 15;
    });

    // Footer / Signatures
    const pageHeight = doc.internal.pageSize.height;
    doc.line(14, pageHeight - 35, 196, pageHeight - 35);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    
    const verifiedBy = results.find(r => r.verifiedBy)?.verifiedBy?.name || 'Dr. Pathologist';
    
    doc.text("Technician", 30, pageHeight - 20);
    doc.text(verifiedBy, 150, pageHeight - 20);
    
    doc.setFont("helvetica", "normal");
    doc.text("(Processed By)", 30, pageHeight - 15);
    doc.text("(Verified By)", 150, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("--- End of Report ---", 105, pageHeight - 5, { align: "center" });

    // Save PDF
    doc.save(`${order.orderId}_Report.pdf`);
    toast.success('Report Downloaded');
  };

  const filteredOrders = orders.filter(o => 
    o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.patient?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Verification</h1>
          <p className="text-gray-500 text-sm mt-1">Verify results and generate final patient reports</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports by Order ID or Patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${order.orderStatus === 'Completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{order.orderId}</h3>
                      <p className="text-sm text-gray-500">{order.patient?.firstName} {order.patient?.lastName}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    order.orderStatus === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.orderStatus === 'Completed' ? 'Fully Verified' : 'Pending Verification'}
                  </span>
                </div>
                
                <div className="flex gap-4 text-sm text-gray-600 mb-6 border-t border-gray-50 pt-4">
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Tests</span>
                    <span className="font-medium">{order.tests?.length}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 uppercase tracking-wider mb-1">Date</span>
                    <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleOpenReport(order)}
                className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200"
              >
                View & Verify Report
              </button>
            </div>
          ))}
          {filteredOrders.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-gray-100">
              <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reports ready for verification yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Award className="h-6 w-6 text-blue-600" />
                  Report Verification
                </h2>
                <p className="text-sm text-gray-500 mt-1">Order: {selectedOrder.orderId} • Patient: {selectedOrder.patient?.firstName} {selectedOrder.patient?.lastName}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => generatePDF(selectedOrder, orderResults)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                <button 
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-100/50">
              {isVerifying ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : orderResults.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                  No results entered yet for this order.
                </div>
              ) : (
                <div className="space-y-6">
                  {orderResults.map(result => (
                    <div key={result._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{result.test.name}</h3>
                          <p className="text-xs text-gray-500">Method: {result.test.method || 'Standard'} • Entered by: {result.enteredBy?.name || 'System'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            result.status === 'Verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status}
                          </span>
                          {result.status !== 'Verified' && (
                            <button
                              onClick={() => handleVerifyResult(result._id)}
                              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                            >
                              Verify Test
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                              <th className="pb-3 font-medium">Investigation</th>
                              <th className="pb-3 font-medium">Result</th>
                              <th className="pb-3 font-medium">Unit</th>
                              <th className="pb-3 font-medium">Reference Range</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {result.parameters.map((p, idx) => (
                              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="py-3 text-sm font-medium text-gray-900">{p.name}</td>
                                <td className={`py-3 text-sm font-bold ${p.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>
                                  {p.value} {p.isAbnormal && '*'}
                                </td>
                                <td className="py-3 text-sm text-gray-500">{p.unit || '-'}</td>
                                <td className="py-3 text-sm text-gray-500">{p.referenceRange || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      {result.remarks && (
                        <div className="p-4 bg-yellow-50/50 border-t border-gray-100 text-sm">
                          <span className="font-semibold text-gray-700">Remarks: </span>
                          <span className="text-gray-600">{result.remarks}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsReports;
