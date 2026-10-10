import React from 'react';
import { X, Printer, Download, Award, CheckCircle, Building, User, CreditCard } from 'lucide-react';
import { generateHighResPDF, printReportDirectly } from './reportUtils';
import toast from 'react-hot-toast';

const DoctorPayoutVoucher = ({ payout, organization = null, onClose }) => {
  if (!payout) return null;

  const doctor = payout.doctor || {};
  const orgName = organization?.name || 'APEX DIAGNOSTICS & RESEARCH LAB';
  const orgEmail = organization?.email || 'accounts@apexdiagnostics.com';
  const orgPhone = organization?.phone || '+91 98765 43210';
  const orgAddress = organization?.address || '123 Medical Enclave, Health City, Metro - 700001';

  const voucherDate = payout.paidAt 
    ? new Date(payout.paidAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handleDownloadPDF = async () => {
    try {
      toast.loading('Generating Payout Voucher PDF...', { id: 'voucher-toast' });
      await generateHighResPDF(
        'doctor-payout-voucher-printable',
        `${payout.voucherNumber || 'Payout'}_${doctor.name?.replace(/\s+/g, '_')}.pdf`
      );
      toast.success('Payout voucher downloaded!', { id: 'voucher-toast' });
    } catch (err) {
      toast.error('Failed to export PDF', { id: 'voucher-toast' });
    }
  };

  const handlePrint = () => {
    printReportDirectly('doctor-payout-voucher-printable');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header Bar */}
        <div className="px-6 py-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Doctor Incentive Payout Voucher: {payout.voucherNumber}
              </h2>
              <p className="text-xs text-slate-500">
                Doctor: {doctor.name} • Settlement Date: {voucherDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
          <div 
            id="doctor-payout-voucher-printable"
            className="bg-white p-8 rounded-xl shadow-lg border border-slate-200 w-full max-w-[190mm] text-slate-800 font-sans text-xs leading-relaxed"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Lab Header */}
            <div className="flex justify-between items-start pb-4 border-b-2 border-emerald-800 mb-6">
              <div>
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">{orgName}</h1>
                <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Physician Referral & Incentive Settlement Division</p>
                <p className="text-[10px] text-slate-500 mt-1">{orgAddress}</p>
                <p className="text-[10px] text-slate-500">Ph: {orgPhone} • Email: {orgEmail}</p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-xs border border-emerald-200">
                  {payout.voucherNumber}
                </span>
                <p className="text-[10px] text-slate-500 mt-2">Date: <strong>{voucherDate}</strong></p>
                <p className="text-[10px] text-slate-500">Mode: <strong>{payout.paymentMethod}</strong></p>
              </div>
            </div>

            {/* Doctor Demographics Card */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Payee Clinician Details</span>
                <p className="text-sm font-bold text-slate-900">{doctor.name}</p>
                <p className="text-xs text-slate-600">{doctor.specialization || 'Consultant Physician'}</p>
                <p className="text-xs text-slate-500">{doctor.clinicName || 'Clinic / Nursing Home'}</p>
                {doctor.phone && <p className="text-[11px] text-slate-500 mt-1">Ph: {doctor.phone}</p>}
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Disbursement Account</span>
                <p className="text-xs text-slate-700"><strong>PAN:</strong> {doctor.panNumber || 'N/A'}</p>
                <p className="text-xs text-slate-700"><strong>Bank / UPI:</strong> {doctor.bankDetails?.bankName || doctor.bankDetails?.upiId || 'Direct Settlement'}</p>
                {doctor.bankDetails?.accountNumber && (
                  <p className="text-xs text-slate-700"><strong>A/C:</strong> {doctor.bankDetails.accountNumber} ({doctor.bankDetails.ifscCode})</p>
                )}
                <p className="text-xs text-slate-700 mt-1 font-mono"><strong>Ref / UTR:</strong> {payout.transactionReference || 'CASH-DISBURSED'}</p>
              </div>
            </div>

            {/* Financial Ledger Table */}
            <table className="w-full text-left border-collapse text-xs mb-6">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-500 uppercase font-bold text-[10px]">
                  <th className="py-2.5 px-2">Description</th>
                  <th className="py-2.5 px-2 text-center">Commission Rate</th>
                  <th className="py-2.5 px-2 text-right">Gross Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-2 font-medium text-slate-800">
                    Clinical Investigation Referrals Commission
                    <p className="text-[10px] text-slate-500">Accrued incentive on diagnostic patient testing</p>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-700">
                    {payout.commissionRate || 15}%
                  </td>
                  <td className="py-3 px-2 text-right font-bold text-slate-900">
                    ₹{payout.commissionAmount?.toLocaleString('en-IN')}
                  </td>
                </tr>

                {payout.taxDeduction > 0 && (
                  <tr className="text-red-700 bg-red-50/50">
                    <td className="py-2 px-2 font-medium">
                      Less: Tax Deducted at Source (TDS under Sec 194J)
                    </td>
                    <td className="py-2 px-2 text-center">-</td>
                    <td className="py-2 px-2 text-right font-bold">
                      - ₹{payout.taxDeduction?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-emerald-50/60 text-sm">
                  <td className="py-3 px-2 font-bold text-slate-900 uppercase">
                    Net Incentive Disbursed
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-emerald-800">PAID</td>
                  <td className="py-3 px-2 text-right font-black text-emerald-800 text-base">
                    ₹{payout.netPaidAmount?.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Notes if any */}
            {payout.notes && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-[11px] mb-8">
                <span className="font-bold text-slate-700">Remarks / Period Notes: </span>
                <span className="text-slate-600">{payout.notes}</span>
              </div>
            )}

            {/* Authentication Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 mt-10">
              <div className="text-center">
                <div className="h-10 flex items-center justify-center">
                  <span className="font-serif italic text-slate-600 text-xs">Accounts Authorized</span>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="font-bold text-slate-800 text-[11px]">{payout.paidBy?.name || 'Finance Officer'}</p>
                  <p className="text-[10px] text-slate-500">Prepared & Verified By</p>
                </div>
              </div>

              <div className="text-center">
                <div className="h-10 flex items-center justify-center">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 border border-emerald-500 text-emerald-700 bg-emerald-50 rounded text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3 h-3" />
                    <span>SETTLED & DISBURSED</span>
                  </div>
                </div>
                <div className="border-t border-slate-300 pt-1">
                  <p className="font-bold text-slate-800 text-[11px]">Apex Central Diagnostics</p>
                  <p className="text-[10px] text-slate-500">Authorized Finance Signatory</p>
                </div>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400 mt-8 border-t border-slate-100 pt-2">
              This is a computer-generated voucher statement. For queries, contact {orgEmail}.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Official Referral Payout Voucher</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default DoctorPayoutVoucher;
