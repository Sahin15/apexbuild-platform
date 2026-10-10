import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

const PosThermalReceipt = ({ receipt, order, organization }) => {
  const barcodeRef = useRef(null);

  const receiptNo = receipt?.receiptNumber || 'REC-2026-00000';
  const orgName = organization?.name || 'APEX CLINICAL DIAGNOSTICS & LABS';
  const orgAddress = organization?.address || '12B Health Park Avenue, Sector 5, Kolkata, WB 700091';
  const orgPhone = organization?.phone || '+91 (033) 2450-8900';
  const gstNo = organization?.gstNumber || '19AAACA1234F1Z8';

  const patient = receipt?.patient || order?.patient || {};
  const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Walk-in Patient';
  const patientAge = patient.age ? `${patient.age}Y` : '';
  const patientGender = patient.gender ? (patient.gender.charAt(0).toUpperCase()) : '';
  const ageGenderStr = [patientAge, patientGender].filter(Boolean).join(' / ');
  const patientId = patient.patientId || 'PID-NEW';
  const doctorName = order?.referringDoctor?.name || 'Self / Direct Walk-In';

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
  const amountPaidThis = receipt?.amount ?? 0;
  const paidBefore = receipt?.paidBeforeThis ?? 0;
  const balanceDue = receipt?.balanceAfterThis ?? (order?.dueAmount ?? 0);
  const paymentMethod = receipt?.paymentMethod || 'Cash';
  const refNo = receipt?.transactionReference || '';
  const cashier = receipt?.cashierName || 'Cash Desk Counter 1';

  useEffect(() => {
    if (barcodeRef.current && receiptNo) {
      try {
        JsBarcode(barcodeRef.current, receiptNo, {
          format: 'CODE128',
          width: 1.4,
          height: 28,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Receipt barcode error:', err);
      }
    }
  }, [receiptNo]);

  return (
    <div 
      id="pos-thermal-receipt" 
      className="bg-white text-black p-4 font-mono text-xs leading-tight mx-auto select-none shadow-md border border-gray-300"
      style={{
        width: '80mm',
        minHeight: '120mm',
        boxSizing: 'border-box',
        color: '#000000'
      }}
    >
      {/* LAB / CLINIC HEADER */}
      <div className="text-center space-y-0.5">
        <h2 className="font-bold text-sm tracking-tight uppercase leading-snug">{orgName}</h2>
        <p className="text-[10px] text-gray-700 leading-tight">{orgAddress}</p>
        <p className="text-[10px] text-gray-700">Ph: {orgPhone}</p>
        {gstNo && <p className="text-[10px] font-semibold text-gray-800">GSTIN: {gstNo}</p>}
      </div>

      <div className="my-2 border-t border-dashed border-gray-400"></div>

      {/* RECEIPT TITLE & BARCODE */}
      <div className="text-center space-y-1">
        <span className="inline-block px-2 py-0.5 border border-black font-bold uppercase text-[10px] tracking-widest bg-gray-50">
          POS Cash Receipt / Tax Slip
        </span>
        <div className="text-[11px] font-bold tracking-wider pt-1">{receiptNo}</div>
        <div className="flex justify-center py-1">
          <svg ref={barcodeRef} className="max-w-[210px] h-7"></svg>
        </div>
      </div>

      <div className="my-1.5 border-t border-dashed border-gray-400"></div>

      {/* PATIENT & APPOINTMENT META */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-600">Date/Time:</span>
          <span className="font-semibold">{formattedDate} {formattedTime}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Order ID:</span>
          <span className="font-bold">{order?.orderId || 'ORD-NEW'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Patient:</span>
          <span className="font-bold uppercase">{patientName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Age / Gender:</span>
          <span>{ageGenderStr || 'N/A'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">UHID:</span>
          <span>{patientId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Ref Doctor:</span>
          <span className="truncate max-w-[150px]">{doctorName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Cashier:</span>
          <span>{cashier}</span>
        </div>
        {order?.homeCollectionDetails?.pickupGps?.latitude && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-600">Pickup GPS:</span>
            <span className="font-bold text-gray-800 font-mono">
              {order.homeCollectionDetails.pickupGps.latitude.toFixed(4)}, {order.homeCollectionDetails.pickupGps.longitude.toFixed(4)}
            </span>
          </div>
        )}
        {order?.patientSignature && (
          <div className="flex justify-between text-[10px]">
            <span className="text-gray-600">Consent Sign:</span>
            <span className="font-bold text-emerald-700">Digital Verified ({order.signedBy || 'Patient'})</span>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-dashed border-gray-400"></div>

      {/* INVESTIGATION ITEMS */}
      <div>
        <div className="flex justify-between font-bold text-[10px] uppercase pb-1 border-b border-gray-200">
          <span>Investigation</span>
          <span>Price (₹)</span>
        </div>
        <div className="divide-y divide-gray-100 py-1 space-y-1">
          {tests.length > 0 ? (
            tests.map((item, idx) => {
              const t = item.test || {};
              const price = item.finalPrice ?? item.price ?? t.price ?? 0;
              return (
                <div key={idx} className="flex justify-between items-start pt-1 text-[11px]">
                  <span className="pr-2 leading-tight break-words max-w-[190px]">
                    {idx + 1}. {t.name || 'Diagnostic Investigation'}
                  </span>
                  <span className="font-semibold shrink-0">₹{price}</span>
                </div>
              );
            })
          ) : (
            <div className="flex justify-between text-[11px]">
              <span>Diagnostic Investigations Bill</span>
              <span>₹{totalAmount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-gray-400"></div>

      {/* BILL TOTALS */}
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{subtotal.toLocaleString('en-IN')}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Discount Applied:</span>
            <span>- ₹{discount.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold border-t border-gray-200 pt-1 text-[12px]">
          <span>Net Bill Amount:</span>
          <span>₹{totalAmount.toLocaleString('en-IN')}</span>
        </div>
        {paidBefore > 0 && (
          <div className="flex justify-between text-gray-600 text-[10px]">
            <span>Paid in Previous Tokens:</span>
            <span>₹{paidBefore.toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-black border-y border-dashed border-gray-400 py-1 text-[12px] bg-gray-50 px-1">
          <span>PAID THIS TRANS ({paymentMethod.toUpperCase()}):</span>
          <span>₹{amountPaidThis.toLocaleString('en-IN')}</span>
        </div>
        {refNo && (
          <div className="flex justify-between text-[10px] text-gray-700">
            <span>Txn Ref / UTR:</span>
            <span className="font-medium">{refNo}</span>
          </div>
        )}
        <div className="flex justify-between font-bold pt-1">
          <span>Remaining Due:</span>
          <span className={balanceDue > 0 ? 'text-red-700' : 'text-green-800'}>
            ₹{balanceDue.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex justify-between text-[10px] pt-0.5">
          <span>Settlement Status:</span>
          <span className="font-bold uppercase">
            {balanceDue === 0 ? 'FULLY PAID' : 'PARTIAL / BALANCE DUE'}
          </span>
        </div>
      </div>

      <div className="my-2 border-t border-dashed border-gray-400"></div>

      {/* QR CODE & FOOTER INSTRUCTIONS */}
      <div className="text-center space-y-1 text-[9px] text-gray-700 pt-1">
        <div className="flex justify-center py-1">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=75x75&data=${encodeURIComponent(`APEXLAB-REC:${receiptNo}|PATIENT:${patientId}|AMT:${amountPaidThis}|DUE:${balanceDue}`)}`}
            alt="Receipt Verification QR"
            className="w-16 h-16 border border-gray-200 p-0.5"
          />
        </div>
        <p className="font-semibold text-gray-900">Scan to verify bill & view test status</p>
        <p>• Fasting required for blood repeats if recommended</p>
        <p>• Please bring this receipt for physical report collection</p>
        <p>• Digital reports available 24/7 at patient portal</p>
        <div className="pt-2 font-bold text-black text-[10px] tracking-wider uppercase">
          *** THANK YOU • WISH YOU SPEEDY RECOVERY ***
        </div>
      </div>
    </div>
  );
};

export default PosThermalReceipt;
