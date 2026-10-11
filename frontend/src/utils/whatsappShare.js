/**
 * WhatsApp Document & Receipt Sharing Engine for ApexBuild
 * Formats structured WhatsApp text with emojis, item breakdowns, totals, and direct wa.me links.
 */

/**
 * Clean and standardize phone numbers (adds country code 91 for Indian 10-digit mobile numbers)
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Generate direct WhatsApp URL (supports pre-filled phone number and encoded text)
 */
export function getWhatsAppUrl(text, phone = '') {
  const encoded = encodeURIComponent(text);
  const cleanPhone = cleanPhoneNumber(phone);
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Open WhatsApp directly in new window/tab
 */
export function openWhatsAppDirect(text, phone = '') {
  const url = getWhatsAppUrl(text, phone);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Format Chicken Distributor Delivery Receipt for WhatsApp
 */
export function formatDistributorSaleWhatsApp(sale, customer) {
  const shop = customer?.shopName || sale.customer?.shopName || 'Retail Customer';
  const owner = customer?.ownerName || sale.customer?.ownerName || '';
  const dateStr = new Date(sale.saleDate || sale.date || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const gross = Number(sale.grossAmount || (sale.weight * sale.sellingRate) || 0);
  const net = Number(sale.netAmount || sale.netTotal || gross);
  const paid = Number(sale.paidAmount || 0);
  const due = Number(sale.dueAmount ?? (net - paid));

  const lines = [
    `🍗 *APEXBUILD - DELIVERY SLIP*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏪 *Shop:* ${shop}${owner ? ` (${owner})` : ''}`,
    `📄 *Slip No:* ${sale.saleNumber || 'N/A'}`,
    `📅 *Date:* ${dateStr}`,
    ``,
    `📦 *DELIVERY DETAILS*`,
    `• Item: Broiler Live Bird`,
    `• Weight: *${sale.weight} KG*`,
    `• Rate: *₹${sale.sellingRate}/KG*`,
    `• Gross Total: ₹${gross.toLocaleString('en-IN')}`,
  ];

  if (Number(sale.discount) > 0) {
    lines.push(`• Discount: -₹${Number(sale.discount).toLocaleString('en-IN')}`);
  }
  if (Number(sale.otherCharges) > 0) {
    lines.push(`• Handling / Other: +₹${Number(sale.otherCharges).toLocaleString('en-IN')}`);
  }

  lines.push(
    `───────────────────`,
    `💰 *Net Amount: ₹${net.toLocaleString('en-IN')}*`,
    `🟢 *Paid Amount: ₹${paid.toLocaleString('en-IN')}* (${sale.paymentMethod || 'CASH'})`
  );

  if (due > 0) {
    lines.push(`🔴 *Balance Due: ₹${due.toLocaleString('en-IN')}*`);
  } else {
    lines.push(`✅ *Status: FULLY PAID*`);
  }

  if (sale.gpsLocation && sale.gpsLocation.latitude && sale.gpsLocation.longitude) {
    lines.push(
      ``,
      `📍 *Drop-off Location:* https://maps.google.com/?q=${sale.gpsLocation.latitude},${sale.gpsLocation.longitude}`
    );
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━`,
    `🙏 Thank you for your business!`,
    `_Powered by ApexBuild Platform_`
  );

  return lines.join('\n');
}

/**
 * Format Building Material Supplier Delivery Challan for WhatsApp
 */
export function formatSupplierChallanWhatsApp({ challan, order, customer, vehicle, driver, products = [] }) {
  const custName = customer?.name || challan?.customer?.name || 'Valued Client';
  const challanNo = challan?.challanNumber || 'N/A';
  const dateStr = new Date(challan?.dispatchDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const vehNo = vehicle?.vehicleNumber || challan?.vehicleNumber || 'Unassigned';
  const drvName = driver?.name || challan?.driverName || 'Dispatch Driver';
  const drvPhone = driver?.phone || challan?.driverPhone || '';

  const lines = [
    `🚛 *APEXBUILD - DISPATCH CHALLAN*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏢 *Client:* ${custName}`,
    `📄 *Challan No:* ${challanNo}`,
    `📅 *Dispatch Date:* ${dateStr}`,
    `📋 *Ref Order:* ${order?.orderNumber || challan?.order?.orderNumber || 'N/A'}`,
    ``,
    `🚚 *LOGISTICS & VEHICLE*`,
    `• Vehicle: *${vehNo.toUpperCase()}*`,
    `• Driver: *${drvName}*${drvPhone ? ` (📞 ${drvPhone})` : ''}`,
    `• Status: *${challan?.status || 'DISPATCHED'}*`,
    ``,
    `📦 *MATERIALS SHIPPED*`
  ];

  const items = order?.items || challan?.items || [];
  if (items.length === 0) {
    lines.push(`• Standard Material Consignment`);
  } else {
    items.forEach((item, idx) => {
      const prod = products.find(p => p._id === (item.product?._id || item.product));
      const prodName = prod?.name || item.name || 'Material Item';
      const unit = prod?.unit || item.unit || 'Units';
      lines.push(`${idx + 1}. *${prodName}*: ${item.quantity} ${unit}`);
    });
  }

  if (challan?.deliveryNotes) {
    lines.push(``, `📝 *Remarks:* ${challan.deliveryNotes}`);
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━`,
    `⚠️ Please inspect goods and sign acknowledgment upon arrival.`,
    `_ApexBuild Material Logistics_`
  );

  return lines.join('\n');
}

/**
 * Format Building Material Supplier Tax Invoice for WhatsApp
 */
export function formatSupplierInvoiceWhatsApp({ invoice, customer, products = [] }) {
  const custName = customer?.name || invoice?.customer?.name || 'Valued Client';
  const invNo = invoice?.invoiceNumber || 'N/A';
  const dateStr = new Date(invoice?.invoiceDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const subTotal = Number(invoice?.subTotal || 0);
  const transport = Number(invoice?.transportCost || 0);
  const otherCost = Number(invoice?.otherCost || 0);
  const grandTotal = Number(invoice?.grandTotal || (subTotal + transport + otherCost));
  const paid = Number(invoice?.paidAmount || 0);
  const due = Number(invoice?.dueAmount ?? (grandTotal - paid));

  const lines = [
    `📑 *APEXBUILD - TAX INVOICE*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏢 *Client:* ${custName}`,
    `📄 *Invoice No:* ${invNo}`,
    `📅 *Date:* ${dateStr}`,
    invoice?.dueDate ? `⏳ *Due Date:* ${new Date(invoice.dueDate).toLocaleDateString('en-IN')}` : '',
    ``,
    `📦 *ITEMIZED BILL*`
  ].filter(Boolean);

  const items = invoice?.items || [];
  items.forEach((item, idx) => {
    const prod = products.find(p => p._id === (item.product?._id || item.product));
    const prodName = prod?.name || 'Material Item';
    const unit = prod?.unit || '';
    lines.push(`${idx + 1}. *${prodName}* - ${item.quantity} ${unit} @ ₹${Number(item.rate || 0).toLocaleString('en-IN')} = ₹${Number(item.total || 0).toLocaleString('en-IN')}`);
  });

  lines.push(
    `───────────────────`,
    `• Subtotal: ₹${subTotal.toLocaleString('en-IN')}`,
    transport > 0 ? `• Transport & Handling: ₹${transport.toLocaleString('en-IN')}` : '',
    otherCost > 0 ? `• Other Adjustments: ₹${otherCost.toLocaleString('en-IN')}` : '',
    `💰 *Grand Total: ₹${grandTotal.toLocaleString('en-IN')}*`,
    `🟢 *Amount Paid: ₹${paid.toLocaleString('en-IN')}*`
  );

  if (due > 0) {
    lines.push(`🔴 *Balance Due: ₹${due.toLocaleString('en-IN')}*`);
  } else {
    lines.push(`✅ *Status: FULLY SETTLED*`);
  }

  lines.push(
    ``,
    `🏦 *BANK DETAILS FOR REMITTANCE:*`,
    `Bank: HDFC Bank Ltd`,
    `A/C: 50200012345678 (IFSC: HDFC0001234)`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🙏 Thank you for your partnership!`,
    `_ApexBuild Enterprise Systems_`
  );

  return lines.filter(Boolean).join('\n');
}

/**
 * Format Contractor Civil RA Bill for WhatsApp
 */
export function formatContractorBillWhatsApp({ bill, project, clientName }) {
  const projName = project?.name || bill?.project?.name || 'Civil Construction Project';
  const billNo = bill?.billNo || 'RA-BILL';
  const dateStr = new Date(bill?.billDate || Date.now()).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const gross = Number(bill?.grossAmount || bill?.currentBillAmount || 0);
  const net = Number(bill?.netPayableAmount || bill?.netPayable || gross);
  const deductions = Number(bill?.totalDeductions || (gross - net));

  const lines = [
    `🏗️ *APEXBUILD - RUNNING ACCOUNT (RA) BILL*`,
    `━━━━━━━━━━━━━━━━━━━`,
    `🏢 *Project:* ${projName}`,
    clientName ? `👤 *Client:* ${clientName}` : '',
    `📄 *Bill No:* ${billNo} (Seq #${bill?.billSequence || 1})`,
    `📅 *Bill Date:* ${dateStr}`,
    bill?.period ? `⏳ *Billing Period:* ${bill.period}` : '',
    ``,
    `📊 *MEASUREMENT & VALUATION SUMMARY*`,
    `• Gross Certified Work: *₹${gross.toLocaleString('en-IN')}*`,
    deductions > 0 ? `• Deductions & Retention: *-₹${deductions.toLocaleString('en-IN')}*` : '',
    `───────────────────`,
    `💰 *Net Certified Payable: ₹${net.toLocaleString('en-IN')}*`,
    `📋 *Status:* ${bill?.status || 'SUBMITTED'}`,
    `━━━━━━━━━━━━━━━━━━━`,
    `Generated via ApexBuild Civil OS`
  ].filter(Boolean);

  return lines.join('\n');
}

export default {
  cleanPhoneNumber,
  getWhatsAppUrl,
  openWhatsAppDirect,
  formatDistributorSaleWhatsApp,
  formatSupplierChallanWhatsApp,
  formatSupplierInvoiceWhatsApp,
  formatContractorBillWhatsApp
};
