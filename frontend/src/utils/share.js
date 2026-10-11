/**
 * Native Mobile Web Share API & Quick Dispatch Utilities
 * Integrates native OS share sheet (iOS/Android) with graceful WhatsApp and Clipboard fallbacks.
 */

import toast from 'react-hot-toast';
import haptics from './haptics';

/**
 * Trigger native OS share sheet or fallback to clipboard/WhatsApp
 */
export async function shareContent({ title, text, url = window.location.href }) {
  haptics.light();

  if (navigator.share && navigator.canShare && navigator.canShare({ title, text, url })) {
    try {
      await navigator.share({ title, text, url });
      haptics.success();
      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled share sheet - silent return
        return false;
      }
      console.warn('Native share failed, falling back to clipboard:', err);
    }
  }

  // Fallback: Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      haptics.success();
      toast.success('Details copied to clipboard!');
      return true;
    }
  } catch (clipErr) {
    console.warn('Clipboard write failed:', clipErr);
  }

  // Ultimate fallback: open WhatsApp directly
  openWhatsApp(text);
  return true;
}

import { 
  getWhatsAppUrl, 
  cleanPhoneNumber, 
  formatDistributorSaleWhatsApp,
  formatSupplierChallanWhatsApp, 
  formatSupplierInvoiceWhatsApp, 
  formatContractorBillWhatsApp 
} from './whatsappShare';

/**
 * Open WhatsApp with formatted text and optional pre-filled phone number
 */
export function openWhatsApp(text, phone = '') {
  haptics.selection();
  const waUrl = getWhatsAppUrl(text, phone);
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Format Chicken Distributor Delivery Slip
 */
export function shareDistributorDelivery(sale, customer) {
  const shop = customer?.shopName || sale.customer?.shopName || 'Retail Customer';
  const text = formatDistributorSaleWhatsApp(sale, customer);
  const phone = customer?.phone || customer?.whatsapp || sale.customer?.phone || '';

  return shareContent({
    title: `Delivery Challan - ${shop}`,
    text
  });
}

/**
 * Format Contractor Civil Daily Progress Report (DPR)
 */
export function shareCivilDPR(report, project) {
  const projName = project?.name || report.project?.name || 'Civil Project';
  const text = [
    `🏗️ *APEXBUILD - DAILY PROGRESS REPORT*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📋 DPR: #${report.dprNo || 'DPR'}`,
    `🏢 Site: ${projName}`,
    `📅 Date: ${new Date(report.reportDate || Date.now()).toLocaleDateString('en-IN')}`,
    `👷 Total Labor: ${report.manpowerCount || (report.manpowerDetails?.length ?? 'Logged')}`,
    `📊 Status: ${report.status || 'Submitted'}`,
    `📝 Notes: ${report.remarks || report.weather || 'Standard progress achieved'}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `DPR ${report.dprNo} - ${projName}`,
    text
  });
}

/**
 * Format Material Supplier Order Summary
 */
export function shareSupplierOrder(order, customer) {
  const custName = customer?.name || order.customer?.name || 'Customer';
  const text = [
    `🚛 *APEXBUILD - DISPATCH ORDER*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📦 Order: #${order.orderNumber || 'ORD'}`,
    `🏢 Client: ${custName}`,
    `💰 Grand Total: ₹${Number(order.grandTotal || 0).toLocaleString('en-IN')}`,
    `💳 Paid: ₹${Number(order.paidAmount || 0).toLocaleString('en-IN')}`,
    `⚠️ Due: ₹${Number(order.dueAmount || 0).toLocaleString('en-IN')}`,
    `🚚 Status: ${order.deliveryStatus || order.status || 'Confirmed'}`,
    `📅 Date: ${new Date(order.orderDate || Date.now()).toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Order #${order.orderNumber} - ${custName}`,
    text
  });
}

/**
 * Format Diagnostics Lab Test Booking Receipt
 */
export function shareDiagnosticsOrder(order, patient) {
  const ptName = patient?.name || order.patient?.name || 'Patient';
  const testCount = order.tests?.length || 1;
  const text = [
    `🧪 *APEXBUILD - LAB TEST RECEIPT*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📄 Order: #${order.orderNumber || 'LAB'}`,
    `👤 Patient: ${ptName}`,
    `🔬 Tests: ${testCount} Diagnostic Investigation${testCount > 1 ? 's' : ''}`,
    `🏠 Collection: ${order.isHomeCollection ? 'Home Sample Pickup' : 'Lab Center Visit'}`,
    `💰 Total: ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}`,
    `💳 Payment: ${order.paymentStatus || 'Pending'}`,
    `📅 Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Lab Test Receipt - ${ptName}`,
    text
  });
}

/**
 * Format Contractor Civil Labour & Muster Roll Summary
 */
export function shareLabourMusterRoll({ project, date, presentCount, absentCount, totalWorkers, totalEstWages }) {
  const projName = project?.name || 'Site Project';
  const text = [
    `👷 *APEXBUILD - DAILY MUSTER ROLL*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏢 Site: ${projName}`,
    `📅 Date: ${date || new Date().toLocaleDateString('en-IN')}`,
    `👥 Headcount: ${presentCount || 0} Present / ${totalWorkers || 0} Deployed`,
    `❌ Absent: ${absentCount || 0}`,
    `💰 Est. Day Wages: ₹${Number(totalEstWages || 0).toLocaleString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Muster Roll - ${projName}`,
    text
  });
}

/**
 * Format Diagnostics Lab Sample Tube Details
 */
export function shareSampleDetails(sample) {
  const ptName = sample.patient ? `${sample.patient.firstName || ''} ${sample.patient.lastName || ''}`.trim() : 'Patient';
  const text = [
    `🧪 *APEXBUILD - DIAGNOSTIC SPECIMEN*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏷️ Barcode: ${sample.barcode || 'N/A'}`,
    `👤 Patient: ${ptName || 'Patient'}`,
    `🩸 Specimen: ${sample.sampleType || 'Blood'}`,
    `🧪 Tube Color: ${sample.tubeConfig?.colorName || sample.tubeColor || 'Standard Tube'}`,
    `📊 Status: ${sample.status || 'Collected'}`,
    `📅 Collected: ${new Date(sample.collectedAt || sample.createdAt || Date.now()).toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Sample ${sample.barcode || ''} - ${ptName}`,
    text
  });
}

/**
 * Format Chicken Distributor Customer Balance / Ledger Slip
 */
export function shareCustomerLedger(customer) {
  const text = [
    `🍗 *APEXBUILD - CUSTOMER LEDGER*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏪 Shop: ${customer.shopName || 'Retail Customer'}`,
    `👤 Owner: ${customer.ownerName || customer.contactPerson || 'Proprietor'}`,
    `📞 Phone: ${customer.phoneNumber || customer.phone || 'N/A'}`,
    `⚠️ Current Balance Due: ₹${Number(customer.outstandingBalance ?? customer.dueAmount ?? customer.balanceDue ?? 0).toLocaleString('en-IN')}`,
    `📅 As of: ${new Date().toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Ledger - ${customer.shopName}`,
    text
  });
}

/**
 * Format Material Supplier Client Statement
 */
export function shareSupplierCustomerStatement(customer) {
  const text = [
    `🚛 *APEXBUILD - CLIENT STATEMENT*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏢 Client: ${customer.name || 'Commercial Client'}`,
    `📞 Phone: ${customer.phone || 'N/A'}`,
    `⚠️ Outstanding Balance: ₹${Number(customer.outstandingBalance ?? customer.dueAmount ?? customer.balanceDue ?? 0).toLocaleString('en-IN')}`,
    `💳 Credit Limit: ₹${Number(customer.creditLimit || 0).toLocaleString('en-IN')}`,
    `📅 As of: ${new Date().toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

  return shareContent({
    title: `Statement - ${customer.name}`,
    text
  });
}

/**
 * Format & Share Material Supplier Delivery Challan
 */
export function shareSupplierChallan({ challan, order, customer, vehicle, driver, products }) {
  const custName = customer?.name || challan?.customer?.name || 'Client';
  const text = formatSupplierChallanWhatsApp({ challan, order, customer, vehicle, driver, products });
  const phone = customer?.phone || challan?.customer?.phone || '';

  return shareContent({
    title: `Delivery Challan #${challan?.challanNumber || ''} - ${custName}`,
    text
  });
}

/**
 * Format & Share Material Supplier Tax Invoice
 */
export function shareSupplierInvoice({ invoice, customer, products }) {
  const custName = customer?.name || invoice?.customer?.name || 'Client';
  const text = formatSupplierInvoiceWhatsApp({ invoice, customer, products });
  const phone = customer?.phone || invoice?.customer?.phone || '';

  return shareContent({
    title: `Tax Invoice #${invoice?.invoiceNumber || ''} - ${custName}`,
    text
  });
}

/**
 * Format & Share Contractor Civil RA Bill
 */
export function shareContractorBill({ bill, project, clientName }) {
  const projName = project?.name || bill?.project?.name || 'Civil Project';
  const text = formatContractorBillWhatsApp({ bill, project, clientName });

  return shareContent({
    title: `RA Bill #${bill?.billNo || ''} - ${projName}`,
    text
  });
}

export default {
  shareContent,
  openWhatsApp,
  shareDistributorDelivery,
  shareCivilDPR,
  shareSupplierOrder,
  shareSupplierChallan,
  shareSupplierInvoice,
  shareContractorBill,
  shareDiagnosticsOrder,
  shareLabourMusterRoll,
  shareSampleDetails,
  shareCustomerLedger,
  shareSupplierCustomerStatement
};
