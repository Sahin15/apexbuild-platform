import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

// Color map for pathology vacuum collection tubes
export const TUBE_COLOR_MAP = {
  edta: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300', dot: '#9333ea', name: 'Lavender (EDTA)' },
  sst: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300', dot: '#eab308', name: 'Gold (SST/Gel)' },
  serum: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', dot: '#dc2626', name: 'Red (Plain/Serum)' },
  fluoride: { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-400', dot: '#4b5563', name: 'Grey (Fluoride)' },
  citrate: { bg: 'bg-sky-100', text: 'text-sky-900', border: 'border-sky-300', dot: '#0284c7', name: 'Light Blue (Citrate)' },
  heparin: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', dot: '#16a34a', name: 'Green (Heparin)' },
  urine: { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', dot: '#f59e0b', name: 'Amber (Urine)' }
};

export const getTubeConfig = (containerType = '', sampleType = '') => {
  const lower = `${containerType} ${sampleType}`.toLowerCase();
  if (lower.includes('edta') || lower.includes('lavender')) return TUBE_COLOR_MAP.edta;
  if (lower.includes('sst') || lower.includes('gold') || lower.includes('gel')) return TUBE_COLOR_MAP.sst;
  if (lower.includes('serum') || lower.includes('plain') || lower.includes('red')) return TUBE_COLOR_MAP.serum;
  if (lower.includes('fluoride') || lower.includes('grey') || lower.includes('gray') || lower.includes('glucose')) return TUBE_COLOR_MAP.fluoride;
  if (lower.includes('citrate') || lower.includes('blue')) return TUBE_COLOR_MAP.citrate;
  if (lower.includes('heparin') || lower.includes('green')) return TUBE_COLOR_MAP.heparin;
  if (lower.includes('urine')) return TUBE_COLOR_MAP.urine;
  return TUBE_COLOR_MAP.edta;
};

const BarcodeSticker = ({ sample, copyIndex = 1, totalCopies = 1, extraLeftMargin = 0 }) => {
  const barcodeRef = useRef(null);
  const patient = sample.patient || {};
  const barcodeValue = sample.barcode || sample.sampleId || 'SMP-000000';
  const tube = getTubeConfig(sample.containerType, sample.sampleType);

  // Format collection date/time
  const collectDate = sample.collectedAt 
    ? new Date(sample.collectedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + 
      new Date(sample.collectedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ' ' + 
      new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Tests list summary
  const testNames = sample.tests?.map(t => typeof t === 'string' ? t : t.name).join(', ') || 'Lab Specimen';

  useEffect(() => {
    if (barcodeRef.current && barcodeValue) {
      try {
        JsBarcode(barcodeRef.current, barcodeValue, {
          format: 'CODE128',
          width: 1.15,
          height: 22,
          displayValue: false,
          margin: 0,
          background: '#ffffff',
          lineColor: '#000000'
        });
      } catch (err) {
        console.error('Barcode render error:', err);
      }
    }
  }, [barcodeValue]);

  return (
    <div 
      className="barcode-sticker bg-white border border-slate-300 rounded flex flex-col justify-between select-none shadow-xs font-sans text-black"
      style={{
        width: '50mm',
        height: '25mm',
        boxSizing: 'border-box',
        overflow: 'hidden',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
        // Generous inner safety margin (3mm left/right) so printer margins never cut off text
        padding: '1.5mm 3.5mm 1.5mm 4mm',
        marginLeft: extraLeftMargin ? `${extraLeftMargin}mm` : '0'
      }}
    >
      {/* Top Header Row: Patient Name & Age/Sex */}
      <div className="flex justify-between items-start leading-none gap-1 border-b border-black/15 pb-0.5">
        <div className="truncate flex-1 pl-0.5">
          <span className="font-extrabold text-[9.5px] uppercase tracking-tight text-black block truncate">
            {patient.lastName ? `${patient.lastName}, ${patient.firstName}` : (patient.firstName || 'PATIENT')}
          </span>
        </div>
        <div className="shrink-0 text-right pr-0.5">
          <span className="text-[8px] font-bold text-slate-900">
            {patient.age || '35'}Y / {patient.gender ? patient.gender[0] : 'U'}
          </span>
        </div>
      </div>

      {/* Middle Row: Barcode Graphic & Tube Type */}
      <div className="flex items-center justify-between gap-1 my-auto px-0.5">
        {/* Barcode Graphic */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <svg ref={barcodeRef} className="w-full max-h-[16px] object-contain" />
          <span className="font-mono text-[8.5px] font-extrabold tracking-widest leading-none mt-0.5 text-black">
            {barcodeValue}
          </span>
        </div>

        {/* Tube Color & Sample Info Pill */}
        <div className="shrink-0 flex flex-col items-end text-right justify-center pl-1.5 border-l border-slate-300">
          <span className="text-[7.5px] font-bold uppercase tracking-tighter text-blue-900 block">
            {sample.sampleType?.split(' ')[0] || 'BLOOD'}
          </span>
          <span 
            className="text-[6.5px] font-extrabold px-1 py-0.5 rounded leading-none mt-0.5 uppercase border"
            style={{ 
              borderColor: tube.dot, 
              color: tube.dot,
              backgroundColor: '#fafafa'
            }}
          >
            {sample.containerType?.split(' ')[0] || 'EDTA'}
          </span>
          {totalCopies > 1 && (
            <span className="text-[6px] text-slate-500 font-mono mt-0.5 font-bold">
              CPY {copyIndex}/{totalCopies}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Row: Tests List & Metadata */}
      <div className="flex justify-between items-end leading-none pt-0.5 border-t border-black/15 text-[7px] text-slate-800 px-0.5">
        <div className="truncate flex-1 pr-1 font-bold">
          <span className="text-black">{testNames}</span>
        </div>
        <div className="shrink-0 font-mono text-[6.5px] text-slate-700 font-medium">
          <span>{collectDate}</span>
        </div>
      </div>
    </div>
  );
};

export default BarcodeSticker;
