// Helper utilities to build UPI deep-links and generate QR codes (base64)
// - buildUpiLink(txnId, orderId, amount, note)
// - generateQrBase64(upiLink)

const QRCode = require('qrcode');

/** Build UPI deep-link URI according to the specification
 *  Example: upi://pay?pa=merchant@bank&pn=MyShop&tr=TXN12345&tn=Order+12345&am=1234.50&cu=INR
 */
function buildUpiLink({ txnId, orderId, amount, note, payeeVpa: pVpa, payeeName: pName }) {
  // allow caller to override payee details, otherwise read from env
  const payeeVpa = pVpa || process.env.UPI_PAYEE_VPA;
  const payeeName = pName || process.env.UPI_PAYEE_NAME;
  if (!payeeVpa || !payeeName) throw new Error('UPI_PAYEE_VPA and UPI_PAYEE_NAME must be set in env or passed to buildUpiLink');

  const upi = new URL('upi://pay');
  upi.searchParams.set('pa', payeeVpa);
  upi.searchParams.set('pn', payeeName);
  upi.searchParams.set('tr', txnId);
  if (note) upi.searchParams.set('tn', note);
  upi.searchParams.set('am', Number(amount).toFixed(2));
  upi.searchParams.set('cu', 'INR');

  // Optional merchant code (mc) can be added via env var
  if (process.env.UPI_MERCHANT_CODE) upi.searchParams.set('mc', process.env.UPI_MERCHANT_CODE);

  return upi.toString();
}

/** Generate a PNG data URL (data:image/png;base64,...) for the UPI link */
async function generateQrDataUrl(upiLink) {
  // qrcode.toDataURL returns a data URL string
  return await QRCode.toDataURL(upiLink, { type: 'image/png' });
}

module.exports = { buildUpiLink, generateQrDataUrl };
