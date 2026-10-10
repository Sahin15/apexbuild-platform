// Converts numbers to Indian English Words for Invoices & Receipts
export function numberToWords(num) {
  if (num === null || num === undefined || isNaN(num)) return 'Zero Rupees Only';
  const n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero Rupees Only';

  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertSection(amount) {
    let str = '';
    if (amount >= 100) {
      str += units[Math.floor(amount / 100)] + ' Hundred ';
      amount %= 100;
    }
    if (amount >= 20) {
      str += tens[Math.floor(amount / 10)] + ' ';
      amount %= 10;
    }
    if (amount > 0) {
      str += units[amount] + ' ';
    }
    return str;
  }

  let words = '';
  const crore = Math.floor(n / 10000000);
  let remainder = n % 10000000;

  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;

  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  const hundred = remainder;

  if (crore > 0) words += convertSection(crore) + 'Crore ';
  if (lakh > 0) words += convertSection(lakh) + 'Lakh ';
  if (thousand > 0) words += convertSection(thousand) + 'Thousand ';
  if (hundred > 0) words += convertSection(hundred);

  const paise = Math.round((Math.abs(num) - n) * 100);
  let result = words.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertSection(paise).trim() + ' Paise';
  }
  return result + ' Only';
}
