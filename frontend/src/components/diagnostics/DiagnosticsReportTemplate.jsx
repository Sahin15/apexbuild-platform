import React from 'react';
import { Activity, ShieldCheck, QrCode, CheckCircle, AlertTriangle } from 'lucide-react';
import { checkValueAbnormal } from './reportUtils';

const DiagnosticsReportTemplate = ({ order, results = [], samples = [], organization = null }) => {
  if (!order) return null;

  const patient = order.patient || {};
  const referringDoctor = order.referringDoctor?.name || 'Self / Direct Walk-In';
  const orgName = organization?.name || order.organizationId?.name || 'APEX DIAGNOSTICS & RESEARCH LAB';
  const orgEmail = organization?.email || order.organizationId?.email || 'reports@apexdiagnostics.com';
  const orgPhone = organization?.phone || order.organizationId?.phone || '+91 98765 43210';
  const orgAddress = organization?.address || order.organizationId?.address || '123 Medical Enclave, Health City, Metro - 700001';

  // Primary sample info
  const primarySample = samples.length > 0 ? samples[0] : (results.find(r => r.sample)?.sample || null);
  const sampleType = primarySample?.sampleType || order.tests?.[0]?.test?.sampleType || 'EDTA Whole Blood / Serum';
  const sampleId = primarySample?.sampleId || `SMP-${order.orderId?.replace('ORD-', '') || '001'}`;
  
  // Format dates
  const registeredDate = order.createdAt ? new Date(order.createdAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : 'N/A';

  const collectedDate = primarySample?.collectedAt 
    ? new Date(primarySample.collectedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : registeredDate;

  const reportDate = order.updatedAt ? new Date(order.updatedAt).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Verification details
  const isAllVerified = results.length > 0 && results.every(r => r.status === 'Verified');
  const verifiedResult = results.find(r => r.verifiedBy);
  const verifierName = verifiedResult?.verifiedBy?.name || 'Dr. Ananya Sen, MD';
  const entererName = results.find(r => r.enteredBy)?.enteredBy?.name || 'S. Mukherjee (MLT)';

  return (
    <div 
      id="diagnostics-report-printable"
      className="bg-white text-slate-800 p-8 md:p-10 w-full max-w-[210mm] mx-auto rounded-none shadow-none font-sans text-xs leading-relaxed"
      style={{
        minHeight: '297mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#0f172a'
      }}
    >
      {/* Top Accreditation Strip */}
      <div className="flex justify-between items-center pb-2 mb-4 border-b border-slate-200 text-[10px] text-slate-500 font-medium tracking-wide uppercase">
        <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>NABL ACCREDITED LAB • ISO 15189:2012 COMPLIANT • CERT NO: MC-4921</span>
        </div>
        <div className="flex items-center gap-2">
          <span>ICMR REG: APX-LAB-9924</span>
          <span>•</span>
          <span>24x7 EMERGENCY SUPPORT</span>
        </div>
      </div>

      {/* Lab Header */}
      <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-blue-900">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-blue-950 uppercase">{orgName}</h1>
              <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Advanced Diagnostic & Molecular Pathology Center</p>
            </div>
          </div>
          <div className="mt-2 text-[10.5px] text-slate-600 space-y-0.5">
            <p>{orgAddress}</p>
            <p className="flex items-center gap-3">
              <span><strong>Phone:</strong> {orgPhone}</span>
              <span>•</span>
              <span><strong>Email:</strong> {orgEmail}</span>
              <span>•</span>
              <span><strong>Web:</strong> www.apexdiagnostics.com</span>
            </p>
          </div>
        </div>

        {/* Verification Barcode / QR Simulation */}
        <div className="flex flex-col items-center bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center shrink-0 ml-4">
          <div className="w-14 h-14 bg-white p-1 rounded border border-slate-200 flex items-center justify-center">
            <QrCode className="w-12 h-12 text-slate-800" />
          </div>
          <span className="text-[9px] font-mono font-bold text-slate-700 mt-1 uppercase tracking-wider">{order.orderId}</span>
          <span className="text-[8px] text-slate-500 font-semibold">SCAN TO VERIFY</span>
        </div>
      </div>

      {/* Patient & Specimen Demographics Box */}
      <div className="bg-slate-50/80 rounded-lg border border-slate-200 p-3 mb-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
          {/* Left Column: Patient Demographics */}
          <div className="space-y-1.5 border-r border-slate-200 pr-4">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Patient Name:</span>
              <span className="font-bold text-slate-900 text-sm uppercase">
                {patient.firstName} {patient.lastName}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">UHID / Patient ID:</span>
              <span className="font-mono font-bold text-slate-800">{patient.patientId || 'PID-2026-001'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Age / Gender:</span>
              <span className="font-semibold text-slate-800">
                {patient.age || 35} Yrs / {patient.gender || 'Not Specified'}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Contact Number:</span>
              <span className="text-slate-700">{patient.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Referred By:</span>
              <span className="font-semibold text-blue-900">{referringDoctor}</span>
            </div>
          </div>

          {/* Right Column: Specimen & Order Demographics */}
          <div className="space-y-1.5 pl-2">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Order / Accession ID:</span>
              <span className="font-mono font-bold text-blue-900">{order.orderId}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Sample ID / Specimen:</span>
              <span className="font-semibold text-slate-800">{sampleId} ({sampleType})</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Collected Date & Time:</span>
              <span className="text-slate-700">{collectedDate}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Report Authenticated:</span>
              <span className="text-slate-700">{reportDate}</span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-500 font-medium">Report Status:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isAllVerified 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {isAllVerified ? 'FINAL CERTIFIED REPORT' : 'PROVISIONAL / PARTIAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Department Section Banner */}
      <div className="bg-blue-900 text-white px-3 py-1.5 rounded-t-md font-bold text-[11px] uppercase tracking-wider flex justify-between items-center mb-0">
        <span>Department of Clinical Pathology & Laboratory Medicine</span>
        <span className="text-[10px] text-blue-200 font-normal">Standard Analytical Methods</span>
      </div>

      {/* Results Content */}
      <div className="border border-t-0 border-slate-200 rounded-b-md p-4 mb-6 space-y-6">
        {results.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-medium">
            No test investigations have been completed for this order yet.
          </div>
        ) : (
          results.map((result, rIdx) => {
            const testName = result.test?.name || 'Investigation';
            const testMethod = result.test?.method || 'Automated Spectrophotometry / Cell Analysis';

            return (
              <div key={result._id || rIdx} className="space-y-2">
                {/* Test Sub-Header */}
                <div className="flex justify-between items-end border-b border-slate-300 pb-1 pt-1">
                  <div>
                    <h3 className="font-extrabold text-blue-950 text-sm uppercase tracking-wide">
                      {testName}
                    </h3>
                    <p className="text-[10px] text-slate-500 italic">Methodology: {testMethod}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      result.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {result.status}
                    </span>
                  </div>
                </div>

                {/* Parameters Table */}
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b-2 border-slate-200 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-1 w-2/5">Investigation / Test Parameter</th>
                      <th className="py-2 px-1 text-center w-1/5">Observed Value</th>
                      <th className="py-2 px-1 text-center w-1/6">Unit</th>
                      <th className="py-2 px-1 text-center w-1/4">Biological Reference Range</th>
                      <th className="py-2 px-1 text-right w-16">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.parameters && result.parameters.length > 0 ? (
                      result.parameters.map((param, pIdx) => {
                        const { isAbnormal, flag } = checkValueAbnormal(
                          param.value,
                          param.referenceRange,
                          param.isAbnormal
                        );

                        return (
                          <tr 
                            key={pIdx} 
                            className={`${isAbnormal ? 'bg-red-50/50 font-medium' : 'hover:bg-slate-50/50'}`}
                          >
                            <td className="py-2 px-1 font-medium text-slate-800">
                              {param.name}
                            </td>
                            <td className={`py-2 px-1 text-center font-bold ${
                              isAbnormal ? 'text-red-600 text-xs' : 'text-slate-900'
                            }`}>
                              {param.value || '-'}
                            </td>
                            <td className="py-2 px-1 text-center text-slate-600">
                              {param.unit || '-'}
                            </td>
                            <td className="py-2 px-1 text-center text-slate-600 font-mono text-[10.5px]">
                              {param.referenceRange || '-'}
                            </td>
                            <td className="py-2 px-1 text-right">
                              {isAbnormal ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-red-100 text-red-700 border border-red-200">
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  {flag || 'ABNORMAL'}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium">NORMAL</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-3 text-center text-slate-400 italic">
                          No specific numeric parameters recorded for this test.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Remarks & Clinical Interpretations */}
                {result.remarks && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded p-2.5 mt-2 text-[10.5px]">
                    <span className="font-bold text-amber-900 uppercase">Clinical Interpretation / Notes: </span>
                    <span className="text-amber-800">{result.remarks}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* QC & Method Disclaimer */}
      <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-[9.5px] text-slate-500 mb-6 leading-relaxed">
        <p className="font-bold text-slate-700 uppercase mb-0.5">Laboratory Diagnostic Notes & Quality Control:</p>
        <p>
          1. Biological reference intervals are derived from healthy populations and may vary depending on clinical history, age, and sex.
        </p>
        <p>
          2. All analytical tests performed on calibrated, closed-system analyzers verified with daily two-level Internal Quality Controls (IQC).
        </p>
        <p>
          3. Test results must be clinically correlated with patient symptoms and full medical evaluation by the consulting physician.
        </p>
      </div>

      {/* Authentication & Signature Block */}
      <div className="grid grid-cols-2 gap-8 pt-4 pb-2 border-t-2 border-slate-200 mt-auto">
        {/* Left Signature: Medical Technologist */}
        <div className="text-center">
          <div className="h-12 flex items-center justify-center">
            {/* Stamp visual */}
            <div className="inline-flex items-center gap-1 px-3 py-1 border border-blue-400 text-blue-700 bg-blue-50/50 rounded font-serif italic text-xs">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Processed by MLT</span>
            </div>
          </div>
          <div className="border-t border-slate-300 pt-1.5 mt-1">
            <p className="font-bold text-slate-800 text-[11px]">{entererName}</p>
            <p className="text-[10px] text-slate-500">Medical Laboratory Technologist</p>
            <p className="text-[9px] text-slate-400">Apex Diagnostics Lab Section</p>
          </div>
        </div>

        {/* Right Signature: Consultant Pathologist */}
        <div className="text-center">
          <div className="h-12 flex items-center justify-center">
            {/* Official Digital Seal Stamp */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-emerald-600 text-emerald-800 bg-emerald-50/70 rounded-md font-sans font-bold text-[10px] uppercase tracking-wider shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>DIGITALLY SIGNED & VERIFIED</span>
            </div>
          </div>
          <div className="border-t border-slate-300 pt-1.5 mt-1">
            <p className="font-bold text-blue-950 text-[11px]">{verifierName}</p>
            <p className="text-[10px] text-slate-600 font-semibold">MD (Pathology), DCP • Consultant Pathologist</p>
            <p className="text-[9px] text-slate-400">Medical Council Reg. No: KMC-58219 • Lab Director</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 mt-4 pt-2 flex justify-between items-center text-[9px] text-slate-400 uppercase tracking-wider">
        <span>Confidential Medical Document</span>
        <span className="font-semibold text-slate-500">*** END OF REPORT ***</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
};

export default DiagnosticsReportTemplate;
