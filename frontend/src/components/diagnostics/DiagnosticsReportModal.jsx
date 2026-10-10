import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  RefreshCw,
  Eye,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import DiagnosticsReportTemplate from './DiagnosticsReportTemplate';
import { generateHighResPDF, printReportDirectly } from './reportUtils';

const DiagnosticsReportModal = ({ orderId, initialOrder = null, onClose, onVerified }) => {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [order, setOrder] = useState(initialOrder);
  const [results, setResults] = useState([]);
  const [samples, setSamples] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(90); // default 90% for comfortable viewing

  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (orderId) {
      loadReportDetails();
    }
  }, [orderId]);

  const loadReportDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/diagnostics/results/order/${orderId}`);
      if (res.data?.data) {
        setOrder(res.data.data.order);
        setResults(res.data.data.results || []);
        setSamples(res.data.data.samples || []);
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error('Failed to load report details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!order) return;
    try {
      setDownloading(true);
      toast.loading('Generating crystal-clear diagnostic PDF...', { id: 'pdf-toast' });
      await generateHighResPDF(
        'diagnostics-report-printable', 
        `${order.orderId || 'Report'}_${order.patient?.lastName || 'Patient'}.pdf`
      );
      toast.success('Lab report downloaded successfully!', { id: 'pdf-toast' });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast.error('Failed to export PDF. Please use the Print button to Save as PDF.', { id: 'pdf-toast' });
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    printReportDirectly('diagnostics-report-printable');
  };

  const handleVerifyAll = async () => {
    const unverified = results.filter(r => r.status !== 'Verified');
    if (unverified.length === 0) {
      toast.info('All tests are already verified.');
      return;
    }

    try {
      setVerifying(true);
      for (const res of unverified) {
        await api.patch(`/diagnostics/results/${res._id}/verify`);
      }
      toast.success('All test parameters verified!');
      await loadReportDetails();
      if (onVerified) onVerified();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const hasUnverified = results.some(r => r.status !== 'Verified');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-hidden animate-fade-in">
      <div className="bg-slate-100 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-300">
        
        {/* Top Control Bar */}
        <div className="bg-white px-5 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Diagnostic Report: {order?.orderId || orderId}
                </h2>
                {results.length > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    hasUnverified ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {hasUnverified ? 'Pending Sign-off' : 'Fully Authenticated'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Patient: {order?.patient?.firstName} {order?.patient?.lastName} • UHID: {order?.patient?.patientId || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(60, prev - 10))}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px] text-slate-700 select-none">
                {zoomLevel}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(130, prev + 10))}
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(90)}
                className="px-1.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-slate-800 hover:bg-white rounded border-l border-slate-200 transition-colors"
                title="Reset Zoom"
              >
                Fit
              </button>
            </div>

            {hasUnverified && (
              <button
                onClick={handleVerifyAll}
                disabled={verifying || loading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{verifying ? 'Verifying...' : 'Sign & Verify All'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              disabled={loading || downloading}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors"
              title="Print document or Save as PDF"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={loading || downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Exporting PDF...' : 'Download PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Body (Guaranteed full-height scrolling) */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-scroll overflow-x-auto p-4 sm:p-8 bg-slate-300/80 relative"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-medium">Loading clinical report parameters...</p>
            </div>
          ) : !order ? (
            <div className="bg-white p-8 rounded-xl shadow text-center max-w-md mx-auto my-12">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <h3 className="font-bold text-slate-900">Report Not Found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Unable to retrieve order details. Please check the order reference.
              </p>
            </div>
          ) : (
            <div 
              className="mx-auto transition-transform origin-top pb-12"
              style={{
                width: '210mm',
                maxWidth: '100%',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center'
              }}
            >
              <div className="shadow-2xl border border-slate-300 bg-white">
                <DiagnosticsReportTemplate
                  order={order}
                  results={results}
                  samples={samples}
                  organization={order.organizationId}
                />
              </div>
            </div>
          )}

          {/* Quick Jump Buttons */}
          <div className="fixed bottom-14 right-8 flex flex-col gap-2 z-20">
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-110"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full shadow-lg border border-slate-200 transition-all hover:scale-110"
              title="Scroll to Signatures & Footer"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="bg-white px-5 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0 z-10">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>Interactive Medical Report Preview (Standard A4 Format) • Zoom: {zoomLevel}%</span>
          </span>
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              onClick={scrollToBottom}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-1"
            >
              <span>Jump to Signatures</span>
              <ArrowDown className="w-3 h-3" />
            </button>
            <span>
              {results.length} Investigation(s) • Total Parameters: {
                results.reduce((acc, r) => acc + (r.parameters?.length || 0), 0)
              }
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DiagnosticsReportModal;
