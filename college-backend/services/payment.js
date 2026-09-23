// ============================================================
// Payment gateway integration.
//
// This is a STUB — it does not actually talk to JazzCash, EasyPaisa,
// or any other gateway yet, because that requires:
//   1. A merchant account with the gateway (business registration required)
//   2. Their specific API docs (each gateway's request/response format,
//      hashing/signature scheme, and sandbox vs. live URLs differ)
//   3. PAYMENT_MERCHANT_ID and PAYMENT_SECRET_KEY in your .env
//
// Once you pick a gateway and get merchant credentials, replace the
// body of initiatePayment() and verifyPaymentWebhookSignature() with
// that gateway's actual integration code (usually provided as a
// code sample in their merchant dashboard/docs).
// ============================================================

async function initiatePayment({ voucherId, amount }) {
  if (!process.env.PAYMENT_MERCHANT_ID || !process.env.PAYMENT_SECRET_KEY) {
    return {
      error: 'Online payment is not configured yet. Please pay via bank transfer or in person, and have the front desk mark this voucher paid.',
      configured: false
    };
  }

  // --- Example shape for a typical gateway integration (replace with real one) ---
  // const signature = crypto.createHmac('sha256', process.env.PAYMENT_SECRET_KEY)
  //   .update(`${voucherId}:${amount}`).digest('hex');
  // const response = await fetch('https://gateway.example.com/api/session', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     merchantId: process.env.PAYMENT_MERCHANT_ID,
  //     amount, reference: voucherId, signature
  //   })
  // });
  // const data = await response.json();
  // return { redirectUrl: data.checkoutUrl };

  return { error: 'Payment gateway not yet implemented — add your provider\'s API here.', configured: true };
}

function verifyPaymentWebhookSignature(req) {
  if (!process.env.PAYMENT_SECRET_KEY) return false;

  // --- Example (replace with your gateway's actual signature check) ---
  // const expected = crypto.createHmac('sha256', process.env.PAYMENT_SECRET_KEY)
  //   .update(JSON.stringify(req.body)).digest('hex');
  // return expected === req.headers['x-gateway-signature'];

  return false; // fail closed until real verification is implemented
}

module.exports = { initiatePayment, verifyPaymentWebhookSignature };
