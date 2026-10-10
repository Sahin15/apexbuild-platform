import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Copy, 
  Grid, 
  FileText, 
  TestTube, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sliders
} from 'lucide-react';
import BarcodeSticker from './BarcodeSticker';

const BarcodePrintModal = ({ samples = [], onClose }) => {
  const [copiesPerSample, setCopiesPerSample] = useState(1);
  const [printLayout, setPrintLayout] = useState('thermal'); // 'thermal' or 'a4'
  const [leftOffset, setLeftOffset] = useState(3); // 3mm safe left offset default to avoid printer clipping

  if (!samples || samples.length === 0) return null;

  // Flatten samples into array of individual stickers based on copiesPerSample
  const stickersToPrint = [];
  samples.forEach((sample) => {
    for (let c = 1; c <= copiesPerSample; c++) {
      stickersToPrint.push({
        sample,
        copyIndex: c,
        totalCopies: copiesPerSample,
        key: `${sample._id || sample.sampleId}-${c}`
      });
    }
  });

  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow.document;

    // Thermal label print style with safe 4mm left offset
    const thermalCSS = `
      @page {
        size: auto;
        margin: 2mm 3mm 2mm ${leftOffset + 2}mm;
      }
      body {
        margin: 0;
        padding: 1mm 2mm 1mm ${leftOffset}mm;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .label-page {
        width: 50mm;
        height: 25mm;
        page-break-after: always;
        break-after: page;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        margin-left: ${leftOffset}mm;
      }
      .barcode-sticker {
        width: 50mm !important;
        height: 25mm !important;
        border: none !important;
        box-shadow: none !important;
        box-sizing: border-box !important;
      }
    `;

    // A4 sheet print style with generous 15mm page margins
    const a4CSS = `
      @page {
        size: A4 portrait;
        margin: 14mm 10mm;
      }
      body {
        margin: 0;
        padding: 5mm;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .a4-grid {
        display: grid;
        grid-template-columns: repeat(3, 52mm);
        gap: 5mm 6mm;
        justify-content: center;
        margin: 0 auto;
      }
      .barcode-sticker {
        width: 50mm !important;
        height: 25mm !important;
        border: 1px dashed #cbd5e1 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
        break-inside: avoid;
        margin: 0 auto !important;
      }
    `;

    const printableContainer = document.getElementById('printable-barcode-content');
    if (!printableContainer) return;

    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Phlebotomy Barcode Labels - Apex Diagnostics</title>
          <style>
            ${printLayout === 'thermal' ? thermalCSS : a4CSS}
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; }
          </style>
        </head>
        <body>
          ${printableContainer.innerHTML}
        </body>
      </html>
    `);

    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1500);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
              <TestTube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Phlebotomy Specimen Barcode Labels
              </h2>
              <p className="text-xs text-slate-500">
                {samples.length} specimen tube(s) selected • Optimized with safe margin offsets to prevent printer edge clipping
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Toolbar */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            {/* Copies selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Copies:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopiesPerSample(num)}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                      copiesPerSample === num 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {num}x
                  </button>
                ))}
              </div>
            </div>

            {/* Layout selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Format:</span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setPrintLayout('thermal')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                    printLayout === 'thermal' 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Thermal (50x25mm)
                </button>
                <button
                  type="button"
                  onClick={() => setPrintLayout('a4')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-colors flex items-center gap-1 ${
                    printLayout === 'a4' 
                      ? 'bg-blue-600 text-white shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>A4 Sheet</span>
                </button>
              </div>
            </div>

            {/* Left Margin Shift Control (to counter physical printer feeder shifts) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Left Margin:</span>
              </span>
              <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                {[1, 3, 5].map((mm) => (
                  <button
                    key={mm}
                    type="button"
                    onClick={() => setLeftOffset(mm)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                      leftOffset === mm 
                        ? 'bg-blue-600 text-white shadow-2xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={`Shift ${mm}mm from left edge`}
                  >
                    +{mm}mm
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Print Button */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Total: <strong>{stickersToPrint.length}</strong>
            </span>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Barcode Labels</span>
            </button>
          </div>
        </div>

        {/* Live Sticker Preview Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col items-center">
          <div className="w-full max-w-3xl">
            <div className="mb-3 flex justify-between items-center text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-slate-600">
                Live Label Proof ({printLayout === 'thermal' ? 'Continuous Roll Preview' : 'A4 Sheet Preview'})
              </span>
              <span className="text-[11px] text-slate-400">
                Left Margin Safe Offset: +{leftOffset}mm
              </span>
            </div>

            {/* Visual Grid of Labels */}
            <div className="flex flex-wrap gap-4 justify-center p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
              {stickersToPrint.map((item) => (
                <div key={item.key} className="transition-transform hover:scale-105 duration-150">
                  <BarcodeSticker
                    sample={item.sample}
                    copyIndex={item.copyIndex}
                    totalCopies={item.totalCopies}
                    extraLeftMargin={leftOffset}
                  />
                </div>
              ))}
            </div>

            {/* Print Edge Notice */}
            <div className="mt-4 p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Anti-Clipping Protection Active:</p>
                <p className="text-[11.5px] text-emerald-900 leading-relaxed">
                  We added safe inner inset padding (4mm) and a <strong>+{leftOffset}mm left margin offset</strong> so patient names and barcodes are never cut off by physical printer margins or roll feed drift. If your printer still clips slightly on the left, simply click <strong>+5mm</strong> above.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Container exclusively used for iframe print extraction */}
        <div id="printable-barcode-content" className="hidden">
          {printLayout === 'thermal' ? (
            stickersToPrint.map((item) => (
              <div key={item.key} className="label-page">
                <BarcodeSticker
                  sample={item.sample}
                  copyIndex={item.copyIndex}
                  totalCopies={item.totalCopies}
                  extraLeftMargin={leftOffset}
                />
              </div>
            ))
          ) : (
            <div className="a4-grid">
              {stickersToPrint.map((item) => (
                <div key={item.key}>
                  <BarcodeSticker
                    sample={item.sample}
                    copyIndex={item.copyIndex}
                    totalCopies={item.totalCopies}
                    extraLeftMargin={0}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
          <span>Apex Diagnostics Barcode Dispatch Engine</span>
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

export default BarcodePrintModal;
