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

/**
 * Open WhatsApp with formatted text
 */
export function openWhatsApp(text) {
  haptics.selection();
  const encoded = encodeURIComponent(text);
  const waUrl = `https://wa.me/?text=${encoded}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Format Chicken Distributor Delivery Slip
 */
export function shareDistributorDelivery(sale, customer) {
  const shop = customer?.shopName || sale.customer?.shopName || 'Retail Customer';
  const text = [
    `🍗 *APEXBUILD - DELIVERY CHALLAN*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `📦 Slip: #${sale.saleNumber || 'SALE'}`,
    `🏪 Shop: ${shop}`,
    `⚖️ Bird Weight: ${sale.weight} KG`,
    `💰 Rate: ₹${sale.sellingRate}/KG`,
    `💵 Total: ₹${Number(sale.netTotal || 0).toLocaleString('en-IN')}`,
    `💳 Paid: ₹${Number(sale.paidAmount || 0).toLocaleString('en-IN')}`,
    `⚠️ Due: ₹${Number(sale.dueAmount || 0).toLocaleString('en-IN')}`,
    `📅 Date: ${new Date(sale.date || Date.now()).toLocaleDateString('en-IN')}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild OS`
  ].join('\n');

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

export default {
  shareContent,
  openWhatsApp,
  shareDistributorDelivery,
  shareCivilDPR,
  shareSupplierOrder,
  shareDiagnosticsOrder
};
