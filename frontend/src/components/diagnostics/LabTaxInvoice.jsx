import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { numberToWords } from '../../utils/numberToWords';

const LabTaxInvoice = ({ receipt, order, organization }) => {
  const barcodeRef = useRef(null);

  const receiptNo = receipt?.receiptNumber || 'REC-2026-00000';
  const orgName = organization?.name || 'Apex Clinical Diagnostics & Imaging Centre';
  const orgLegalName = organization?.legalName || 'Apex Healthcare & Diagnostic Services Pvt. Ltd.';
  const orgAddress = organization?.address || 'Plot 14, Health Park Enclave, Sector 5, Salt Lake, Kolkata, WB 700091';
  const orgPhone = organization?.phone || '+91 (033) 2450-8900 / +91 98301 99887';
  const orgEmail = organization?.email || 'billing@apexdiagnostics.in';
  const gstNo = organization?.gstNumber || '19AAACA1234F1Z8';

  const patient = receipt?.patient || order?.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Direct Walk-In Patient';
  const patientAge = patient.age ? `${patient.age} Yrs` : '';
  const patientGender = patient.gender || '';
  const ageGenderStr = [patientAge, patientGender].filter(Boolean).join(' / ') || 'N/A';
  const patientId = patient.patientId || 'PID-2026-0000';
  const patientPhone = patient.phone || 'N/A';
  const patientAddress = patient.address || 'Kolkata, West Bengal';

  const doctorName = order?.referringDoctor?.name || 'Self / Direct Walk-In';
  const orderId = order?.orderId || 'ORD-2026-0000';
  const tests = order?.tests || [];
  const paymentDate = receipt?.paymentDate || receipt?.createdAt || new Date();
  
  const formattedDate = new Date(paymentDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const formattedTime = new Date(paymentDate).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const subtotal = receipt?.subtotal ?? order?.subtotal ?? 0;
  const discount = receipt?.discount ?? order?.totalDiscount ?? 0;
  const totalAmount = receipt?.orderTotal ?? order?.totalAmount ?? 0;
  const paidAmount = order?.paidAmount ?? receipt?.amount ?? 0;
  const balanceDue = receipt?.balanceAfterThis ?? (order?.dueAmount ?? 0);
  const cashier = receipt?.cashierName || 'Cash Desk Counter 1';
  const paymentsList = order?.payments && order.payments.length > 0 
    ? order.payments 
    : [
        {
          receiptNumber: receiptNo,
          paymentMethod: receipt?.paymentMethod || 'Cash',
          transactionReference: receipt?.transactionReference || 'COUNTER-CASH',
          amount: receipt?.amount || paidAmount,
          paidAt: paymentDate,
          cashierName: cashier
        }
      ];

  const totalWords = numberToWords(totalAmount);

  useEffect(() => {
    if (barcodeRef.current && receiptNo) {
      try {
        JsBarcode(barcodeRef.current, receiptNo, {
          format: 'CODE128',
          width: 1.5,
          height: 32,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Invoice barcode error:', err);
      }
    }
  }, [receiptNo]);

  return (
    <div 
      id="lab-tax-invoice"
      className="bg-white text-gray-900 mx-auto font-sans p-8 select-none shadow-xl border border-gray-200"
      style={{
        width: '210mm',
        minHeight: '297mm',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER SECTION */}
      <div className="flex justify-between items-start border-b-2 border-blue-900 pb-5">
        <div className="space-y-1 max-w-[65%]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center font-black text-xl shadow-xs">
              +
            </div>
            <div>
              <h1 className="text-xl font-black text-blue-950 uppercase tracking-tight leading-tight">
                {orgName}
              </h1>
              <p className="text-xs text-blue-800 font-medium">{orgLegalName}</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 pt-1 leading-relaxed">{orgAddress}</p>
          <div className="flex flex-wrap gap-x-4 text-xs text-gray-600">
            <span><strong>Tel:</strong> {orgPhone}</span>
            <span><strong>Email:</strong> {orgEmail}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 text-xs pt-0.5">
            <span className="text-gray-800"><strong>GSTIN:</strong> {gstNo}</span>
            <span className="text-gray-800"><strong>Clinical Reg No:</strong> CEA/WB/2024/0912</span>
            <span className="text-blue-900 font-semibold"><strong>SAC Code:</strong> 999316 (Human Diagnostic)</span>
          </div>
        </div>

        {/* NABL & ACCREDITATION BADGE */}
        <div className="text-right flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 rounded-md text-blue-950 font-bold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            NABL ACCREDITED LAB (MC-4120)
          </div>
          <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">ISO 15189:2022 Certified</p>
          <div className="mt-3 text-center">
            <svg ref={barcodeRef} className="max-w-[170px] h-8"></svg>
            <p className="text-[10px] font-mono text-gray-600">{receiptNo}</p>
          </div>
        </div>
      </div>

      {/* DOCUMENT TITLE BAR */}
      <div className="my-3 py-1.5 px-4 bg-gray-900 text-white flex justify-between items-center rounded-sm">
        <span className="font-bold text-xs uppercase tracking-widest">TAX INVOICE / BILL OF SUPPLY</span>
        <span className="text-[11px] font-medium tracking-wide text-gray-300">ORIGINAL FOR RECIPIENT / PATIENT COPY</span>
      </div>

      {/* TWO-COLUMN METADATA GRIDS */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        {/* Left Column: Patient Profile */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
          <div className="font-bold text-slate-800 uppercase text-[11px] border-b border-slate-200 pb-1 flex justify-between">
            <span>Patient Information</span>
            <span className="font-mono text-blue-800">{patientId}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <span className="text-gray-500 font-medium">Name:</span>
            <span className="col-span-2 font-bold text-gray-900 uppercase">{patientName}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Age / Gender:</span>
            <span className="col-span-2 font-semibold text-gray-800">{ageGenderStr}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Phone No:</span>
            <span className="col-span-2 text-gray-800">{patientPhone}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Address:</span>
            <span className="col-span-2 text-gray-700 truncate">{patientAddress}</span>
          </div>
        </div>

        {/* Right Column: Billing & Order Info */}
        <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1.5">
          <div className="font-bold text-slate-800 uppercase text-[11px] border-b border-slate-200 pb-1 flex justify-between">
            <span>Invoice & Order Reference</span>
            <span className="font-mono text-blue-800">{orderId}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 pt-0.5">
            <span className="text-gray-500 font-medium">Invoice No:</span>
            <span className="col-span-2 font-bold text-blue-950 font-mono">{receiptNo}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Invoice Date:</span>
            <span className="col-span-2 text-gray-800">{formattedDate} ({formattedTime})</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Ref Doctor:</span>
            <span className="col-span-2 font-semibold text-gray-900">{doctorName}</span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-gray-500 font-medium">Billed By:</span>
            <span className="col-span-2 text-gray-800">{cashier}</span>
          </div>
        </div>
      </div>

      {/* ITEMIZED TESTS TABLE */}
      <div className="mt-4">
        <table className="w-full text-left text-xs border border-gray-300">
          <thead className="bg-blue-900 text-white uppercase text-[10px] tracking-wider">
            <tr>
              <th className="py-2 px-3 w-10 text-center">#</th>
              <th className="py-2 px-3">Diagnostic Investigation / Service</th>
              <th className="py-2 px-3 w-28">Department</th>
              <th className="py-2 px-3 w-20 text-center">SAC Code</th>
              <th className="py-2 px-3 w-24 text-right">Standard (₹)</th>
              <th className="py-2 px-3 w-20 text-right">Disc (₹)</th>
              <th className="py-2 px-3 w-24 text-right">Net Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-gray-800">
            {tests.length > 0 ? (
              tests.map((item, idx) => {
                const t = item.test || {};
                const stdPrice = item.price ?? t.price ?? 0;
                const disc = item.discount || 0;
                const netPrice = item.finalPrice ?? (stdPrice - disc);
                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="py-2 px-3 text-center text-gray-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-gray-900">
                      {t.name || 'Diagnostic Test'}
                      <span className="block text-[10px] text-gray-500 font-mono font-normal">
                        Code: {t.testId || 'TST-00'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-gray-600">{t.department || 'Pathology'}</td>
                    <td className="py-2 px-3 text-center font-mono text-gray-600">999316</td>
                    <td className="py-2 px-3 text-right">₹{stdPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      {disc > 0 ? `₹${disc.toFixed(2)}` : '₹0.00'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-gray-950">₹{netPrice.toFixed(2)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="py-3 px-3 text-center">1</td>
                <td className="py-3 px-3 font-semibold">Diagnostic Investigations Package</td>
                <td className="py-3 px-3">Laboratory</td>
                <td className="py-3 px-3 text-center">999316</td>
                <td className="py-3 px-3 text-right">₹{subtotal.toFixed(2)}</td>
                <td className="py-3 px-3 text-right">₹{discount.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-bold">₹{totalAmount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* FINANCIAL SUMMARY & SETTLEMENT LEDGER */}
      <div className="mt-4 grid grid-cols-12 gap-4">
        {/* Left Side: Amount in Words & Payment History */}
        <div className="col-span-7 space-y-3">
          <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-xs">
            <span className="font-semibold text-blue-900 uppercase text-[10px] block">Amount In Words:</span>
            <p className="font-bold text-gray-900 italic pt-0.5">{totalWords}</p>
          </div>

          {/* Payment Receipts History */}
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="bg-gray-100 px-3 py-1.5 font-bold text-[11px] text-gray-800 uppercase flex justify-between">
              <span>Payment Receipts Recorded</span>
              <span>Total Paid: ₹{paidAmount.toLocaleString('en-IN')}</span>
            </div>
            <table className="w-full text-[11px] text-left">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-1 px-2.5">Receipt #</th>
                  <th className="py-1 px-2">Mode</th>
                  <th className="py-1 px-2">Ref / UTR</th>
                  <th className="py-1 px-2.5 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentsList.map((p, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="py-1 px-2.5 font-mono font-medium text-blue-900">{p.receiptNumber || receiptNo}</td>
                    <td className="py-1 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-[10px]">
                        {p.paymentMethod}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-gray-500 font-mono text-[10px] truncate max-w-[120px]">
                      {p.transactionReference || 'DIRECT-COUNTER'}
                    </td>
                    <td className="py-1 px-2.5 text-right font-bold text-green-700">₹{(p.amount || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-[10px] text-gray-500 space-y-0.5">
            <p className="font-medium text-gray-700">GST Exemption Note:</p>
            <p>Healthcare diagnostic services rendered by clinical establishments are exempt from GST under Notification No. 12/2017-Central Tax (Rate), Serial No. 74.</p>
          </div>
        </div>

        {/* Right Side: Totals Calculation Block */}
        <div className="col-span-5 bg-slate-50 p-3 rounded border border-slate-300 text-xs space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (Gross):</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Total Discount:</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>GST / CGST / SGST (0%):</span>
            <span>₹0.00</span>
          </div>
          <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-sm text-gray-900">
            <span>Net Bill Amount:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-green-700">
            <span>Total Paid Amount:</span>
            <span>₹{paidAmount.toFixed(2)}</span>
          </div>
          <div className="border-t border-dashed border-gray-300 pt-2 flex justify-between font-bold text-sm">
            <span className={balanceDue > 0 ? 'text-red-700' : 'text-gray-900'}>Balance Due:</span>
            <span className={balanceDue > 0 ? 'text-red-700 font-mono' : 'text-green-700 font-mono'}>
              ₹{balanceDue.toFixed(2)}
            </span>
          </div>
          <div className="pt-1 text-center">
            <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
              balanceDue === 0 ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {balanceDue === 0 ? '✓ Invoice Fully Cleared' : '⚠ Outstanding Balance Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* FOOTER & SIGNATURE SECTION */}
      <div className="mt-8 pt-4 border-t-2 border-gray-200">
        <div className="grid grid-cols-3 gap-4 items-end text-xs">
          {/* Terms & Conditions */}
          <div className="text-[9.5px] text-gray-500 space-y-1">
            <p className="font-bold text-gray-700 uppercase">Terms & Conditions:</p>
            <p>1. Please retain this invoice to collect test reports.</p>
            <p>2. Diagnostic services are non-refundable once sample is processed.</p>
            <p>3. Online reports can be verified via QR code or patient portal.</p>
          </div>

          {/* Cashier Sign */}
          <div className="text-center">
            <div className="h-10 border-b border-gray-300 flex items-end justify-center pb-1">
              <span className="font-mono text-gray-700 italic text-[11px]">{cashier}</span>
            </div>
            <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Billing Cashier</p>
          </div>

          {/* Authorized Lab Signatory */}
          <div className="text-center">
            <div className="h-10 border-b border-gray-300 flex items-end justify-center pb-1">
              <span className="font-serif font-bold text-blue-900 text-xs">Dr. Ananya Sen (MD Pathologist)</span>
            </div>
            <p className="text-[10px] font-bold text-gray-600 mt-1 uppercase">Authorized Signatory / Lab Director</p>
          </div>
        </div>

        <div className="mt-4 text-center text-[9px] text-gray-400">
          This is a computer generated tax invoice. ApexBuild Clinical OS Engine v2.4 • Printed on {new Date().toLocaleString('en-IN')}
        </div>
      </div>
    </div>
  );
};

export default LabTaxInvoice;
