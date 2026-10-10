import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

/**
 * Parses numeric values and reference intervals to auto-detect if a result is HIGH, LOW, or ABNORMAL
 * Supports both Quantitative (e.g. "13.0 - 17.0", "< 200", "> 60") and Qualitative (e.g. "Negative", "Non-Reactive")
 */
export const checkValueAbnormal = (val, refRange, isExplicitAbnormal = false) => {
  if (isExplicitAbnormal) {
    return { isAbnormal: true, flag: 'ABNORMAL', label: '▲ ABNORMAL' };
  }

  if (val === undefined || val === null || String(val).trim() === '') {
    return { isAbnormal: false, flag: null };
  }

  if (!refRange || String(refRange).trim() === '') {
    return { isAbnormal: false, flag: null };
  }

  const valStr = String(val).trim();
  const rangeStr = String(refRange).trim();
  const lowerVal = valStr.toLowerCase();
  const lowerRange = rangeStr.toLowerCase();

  // 1. Qualitative Evaluation (Negative, Non-Reactive, Absent, Nil, etc.)
  const isNegativeReference = /neg|non-react|absent|nil|not detect|clear/i.test(lowerRange);
  const isPositiveReference = /pos|react|detect|present|seen/i.test(lowerRange) && !isNegativeReference;

  if (isNegativeReference) {
    const indicatesPositive = /pos|react|detect|present|seen|abnormal|high/i.test(lowerVal);
    const indicatesNegative = /neg|non-react|absent|nil|not detect|clear/i.test(lowerVal);

    if (indicatesPositive) {
      return { isAbnormal: true, flag: 'ABNORMAL', label: '▲ POSITIVE' };
    }
    if (indicatesNegative) {
      return { isAbnormal: false, flag: 'NORMAL', label: '✓ Negative' };
    }

    // If observed value is a number (e.g. 152 in Dengue or titer like 1:80)
    const numericVal = parseFloat(valStr.replace(/,/g, ''));
    if (!isNaN(numericVal)) {
      if (numericVal > 0) {
        return { isAbnormal: true, flag: 'ABNORMAL', label: '▲ POSITIVE' };
      } else {
        return { isAbnormal: false, flag: 'NORMAL', label: '✓ Negative' };
      }
    }

    // Any other non-negative text when expected is Negative
    return { isAbnormal: true, flag: 'ABNORMAL', label: '▲ ABNORMAL' };
  }

  if (isPositiveReference) {
    const indicatesNegative = /neg|non-react|absent|nil|not detect/i.test(lowerVal);
    if (indicatesNegative) {
      return { isAbnormal: true, flag: 'LOW', label: '▼ NEGATIVE' };
    }
    return { isAbnormal: false, flag: 'NORMAL', label: '✓ Positive' };
  }

  // 2. Quantitative / Numeric Evaluation
  const numVal = parseFloat(valStr.replace(/,/g, ''));
  if (!isNaN(numVal)) {
    // Pattern: "min - max" e.g. "13.5 - 17.5" or "70 - 99" or "150 - 450"
    const rangeMatch = rangeStr.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      if (!isNaN(min) && numVal < min) {
        return { isAbnormal: true, flag: 'LOW', label: '▼ LOW' };
      }
      if (!isNaN(max) && numVal > max) {
        return { isAbnormal: true, flag: 'HIGH', label: '▲ HIGH' };
      }
      return { isAbnormal: false, flag: 'NORMAL', label: '✓ Normal' };
    }

    // Pattern: "< max" or "<= max" e.g. "< 200" or "<= 140"
    const lessMatch = rangeStr.match(/(?:<|<=)\s*([0-9.]+)/);
    if (lessMatch) {
      const max = parseFloat(lessMatch[1]);
      if (!isNaN(max) && numVal > max) {
        return { isAbnormal: true, flag: 'HIGH', label: '▲ HIGH' };
      }
      return { isAbnormal: false, flag: 'NORMAL', label: '✓ Normal' };
    }

    // Pattern: "> min" or ">= min" e.g. "> 60"
    const greaterMatch = rangeStr.match(/(?:>|>=)\s*([0-9.]+)/);
    if (greaterMatch) {
      const min = parseFloat(greaterMatch[1]);
      if (!isNaN(min) && numVal < min) {
        return { isAbnormal: true, flag: 'LOW', label: '▼ LOW' };
      }
      return { isAbnormal: false, flag: 'NORMAL', label: '✓ Normal' };
    }
  }

  return { isAbnormal: false, flag: null };
};

/**
 * High-definition Canvas capture to A4 PDF with multi-page support
 */
export const generateHighResPDF = async (elementId, filename = 'Lab_Report.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Report printable element not found');
  }

  // Generate canvas with 2x scale for crisp printing
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png', 1.0);
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pageWidth = 210;
  const pageHeight = 297;
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // First page
  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // Add pages if document is multi-page
  while (heightLeft > 2) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
  return true;
};

/**
 * Direct print using an isolated iframe to guarantee no UI interference
 */
export const printReportDirectly = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow.document;
  
  // Collect styles
  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Diagnostic Laboratory Report</title>
        ${styles}
        <style>
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: #0f172a !important;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          #print-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${element.innerHTML}
        </div>
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

/**
 * Direct print dedicated for POS Thermal Slips (80mm) and A4 Tax Invoices
 */
export const printReceiptDirectly = (elementId, format = '80mm') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';
  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow.document;

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(style => style.outerHTML)
    .join('\n');

  const pageCss = format === '80mm' 
    ? `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        margin: 0;
        padding: 0;
        width: 80mm;
        background: white !important;
        font-family: monospace;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #print-wrapper {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    `
    : `
      @page {
        size: A4 portrait;
        margin: 6mm;
      }
      body {
        margin: 0;
        padding: 0;
        background: white !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      #print-wrapper {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
    `;

  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Receipt</title>
        ${styles}
        <style>
          ${pageCss}
        </style>
      </head>
      <body>
        <div id="print-wrapper">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);

  frameDoc.close();

  printFrame.contentWindow.focus();
  setTimeout(() => {
    printFrame.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(printFrame)) {
        document.body.removeChild(printFrame);
      }
    }, 1500);
  }, 400);
};

