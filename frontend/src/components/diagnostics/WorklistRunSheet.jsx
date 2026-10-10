import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';
import { getTubeConfig } from './BarcodeSticker';
import { Printer, X, Download, ShieldCheck, Beaker } from 'lucide-react';
import { printReceiptDirectly, generateHighResPDF } from './reportUtils';
import toast from 'react-hot-toast';

const WorklistRunSheet = ({ 
  isOpen, 
  onClose, 
  department = 'Hematology', 
  items = [], 
  organization 
}) => {
  if (!isOpen) return null;

  const orgName = organization?.name || 'Apex Clinical Diagnostics & Research Labs';
  const runId = `RUN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${department.slice(0, 3).toUpperCase()}-01`;
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  const handlePrint = () => {
    printReceiptDirectly('worklist-run-sheet-printable', 'A4');
  };

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating Worklist Run-Sheet PDF...', { id: 'runsheet-toast' });
      await generateHighResPDF('worklist-run-sheet-printable', `${runId}.pdf`);
      toast.success('Run-sheet downloaded!', { id: 'runsheet-toast' });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: 'runsheet-toast' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
              <Beaker className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Departmental Instrument Run-Sheet ({department} Bench)
              </h2>
              <p className="text-xs text-slate-500">
                Batch #{runId} • {items.length} Samples Queued for Testing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print Run-Sheet (A4)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Run Sheet Document */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-200/60 flex justify-center items-start min-h-0">
          <div 
            id="worklist-run-sheet-printable"
            className="bg-white text-gray-900 mx-auto font-sans p-8 select-none shadow-xl border border-gray-200 w-full"
            style={{
              width: '210mm',
              minHeight: '297mm',
              boxSizing: 'border-box'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-lg font-black text-slate-950 uppercase tracking-tight">
                  {orgName}
                </h1>
                <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider mt-0.5">
                  DEPARTMENT OF {department.toUpperCase()} • ANALYZER RUN-SHEET
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  NABL Quality Controlled Bench Log • Instrument Batch Loading Record
                </p>
              </div>

              <div className="text-right text-xs space-y-1">
                <div className="inline-block px-2.5 py-1 bg-slate-100 font-mono font-bold text-slate-800 rounded border border-slate-300">
                  {runId}
                </div>
                <p className="text-gray-600 pt-1">
                  <strong>Date:</strong> {dateStr} ({timeStr})
                </p>
                <p className="text-gray-600">
                  <strong>Bench Station:</strong> {department} Auto-Analyzer #01
                </p>
              </div>
            </div>

            {/* Quality Control & Analyzer Status Banner */}
            <div className="my-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded flex justify-between items-center text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-emerald-950">
                  Daily Instrument Calibration & 3-Level Quality Control (QC): <strong>PASSED (Within 2 SD)</strong>
                </span>
              </div>
              <span className="text-emerald-800 font-mono text-[11px]">
                QC Run: OK-2026-1010
              </span>
            </div>

            {/* Specimen Loading Table */}
            <div className="mt-3">
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-slate-900 text-white uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2 px-2 text-center w-10">Rack</th>
                    <th className="py-2 px-2.5 w-32">Specimen Barcode</th>
                    <th className="py-2 px-3">Patient Demographics</th>
                    <th className="py-2 px-2.5">Tube / Container</th>
                    <th className="py-2 px-3">Test Requested</th>
                    <th className="py-2 px-2 text-center w-16">Priority</th>
                    <th className="py-2 px-2 text-center w-24">SLA Delivery</th>
                    <th className="py-2 px-2 text-center w-16">QC Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.length > 0 ? (
                    items.map((item, idx) => {
                      const patient = item.patient || {};
                      const sample = item.sample || {};
                      const tube = getTubeConfig(sample.containerType, sample.sampleType);
                      const isStat = item.priority === 'STAT';
                      const isBreached = item.tat?.tatStatus === 'BREACHED';

                      return (
                        <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                          <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                            {String(idx + 1).padStart(2, '0')}
                          </td>

                          <td className="py-2 px-2.5 font-mono">
                            <span className="font-bold text-blue-900 block text-[11px]">
                              {sample.barcode || item.orderNumber}
                            </span>
                            <span className="text-[9.5px] text-gray-500 font-normal">
                              {item.orderNumber}
                            </span>
                          </td>

                          <td className="py-2 px-3">
                            <div className="font-bold text-gray-900">{patient.name}</div>
                            <div className="text-[10px] text-gray-500">
                              {patient.patientId} • {patient.age ? `${patient.age}Y` : ''} {patient.gender || ''}
                            </div>
                          </td>

                          <td className="py-2 px-2.5">
                            <div className="flex items-center gap-1.5">
                              <span 
                                className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/20"
                                style={{ backgroundColor: tube.dot }}
                              ></span>
                              <span className="text-[10.5px] text-gray-800 font-medium">
                                {sample.containerType || 'Standard Tube'}
                              </span>
                            </div>
                            <span className="text-[9.5px] text-gray-500 block">
                              {sample.sampleType || 'Specimen'}
                            </span>
                          </td>

                          <td className="py-2 px-3 font-semibold text-gray-900">
                            {item.test.name}
                            <span className="block text-[9.5px] text-gray-500 font-mono font-normal">
                              {item.test.parameters?.length || 0} parameters
                            </span>
                          </td>

                          <td className="py-2 px-2 text-center">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase ${
                              isStat 
                                ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                : item.priority === 'Urgent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.priority}
                            </span>
                          </td>

                          <td className="py-2 px-2 text-center font-mono text-[10px]">
                            <span className={isBreached ? 'text-rose-700 font-bold' : 'text-gray-700'}>
                              {item.tat?.targetDate 
                                ? new Date(item.tat.targetDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) 
                                : 'Std'}
                            </span>
                            {isBreached && <span className="block text-[8px] text-rose-600 font-bold uppercase">Breached</span>}
                          </td>

                          <td className="py-2 px-2 text-center">
                            <div className="w-4 h-4 border border-gray-400 rounded mx-auto"></div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-8 text-center text-gray-500">
                        No active samples queued in this departmental run.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Sign-off Block */}
            <div className="mt-8 pt-6 border-t-2 border-gray-300">
              <div className="grid grid-cols-3 gap-6 text-xs text-center">
                <div>
                  <div className="h-10 border-b border-gray-300 flex items-end justify-center pb-1">
                    <span className="font-mono text-gray-700 italic text-[11px]">Bench Technologist</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Sample Loading Tech</p>
                </div>

                <div>
                  <div className="h-10 border-b border-gray-300 flex items-end justify-center pb-1">
                    <span className="font-mono text-gray-700 italic text-[11px]">Sysmex / Vitros QC Pass</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Instrument Calibration Sign</p>
                </div>

                <div>
                  <div className="h-10 border-b border-gray-300 flex items-end justify-center pb-1">
                    <span className="font-serif font-bold text-blue-900 text-xs">Dr. Ananya Sen (MD Pathologist)</span>
                  </div>
                  <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Pathologist Supervisor</p>
                </div>
              </div>

              <div className="mt-6 text-center text-[9px] text-gray-400">
                ApexBuild Clinical OS • Departmental Instrument Run-Sheet • Printed on {new Date().toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorklistRunSheet;
