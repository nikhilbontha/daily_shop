UPI Checkout Prototype (backend-only)

This small Node.js Express service demonstrates a UPI QR checkout flow for prototyping.

Features
- POST /api/checkout: validate order, create txn, generate UPI deep-link and QR (base64)
- GET /api/txn/:txnId: (not implemented in this prototype; txn lookup via DB is available)
- POST /api/webhook/psp: simple webhook receiver to update txn status (shared-secret)

Important: This is a prototype. For production, integrate with a PSP (Razorpay/Cashfree/Paytm) to reliably receive payment confirmations.

Setup
1. Install dependencies

   npm init -y
   npm i express mongoose qrcode uuid dotenv body-parser

2. Copy `.env.example` to `.env` and set values (especially `MONGO_URI`, `UPI_PAYEE_VPA`, `UPI_PAYEE_NAME`, and `WEBHOOK_SECRET`).

3. Start MongoDB locally or point `MONGO_URI` to your cluster.


4. Run the server

   node server.js

Port override: you can pass a port on the command line to override `PORT` from the environment. This is helpful if the default port (2004) is in use.

   # example: run on port 3005
   node server.js 3005

API examples

1) Create a sample order (use Mongo shell / GUI)

In Mongo shell insert a simple order:

db.orders.insertOne({ orderId: 'ORD123', items: [{ productId: 'P1', name: 'Test', qty: 1, price: 1234.5 }], totalAmount: 1234.5, userId: 'user1' })

2) Checkout (server will validate order total and generate UPI QR)

curl -X POST http://localhost:2004/api/checkout -H "Content-Type: application/json" -d "{\"orderId\":\"ORD123\",\"amount\":1234.5}"

Response:
{
  "transactionId": "<uuid>",
  "amount": 1234.5,
  "upiLink": "upi://pay?...",
  "qrBase64": "data:image/png;base64,..."
}

Use the `qrBase64` as an image src in any HTML:
<img src="data:image/png;base64,..." />

Scanning the QR with PhonePe/GPay will open the payment flow prefilled with the amount.

3) Simulate PSP webhook (prototype)

curl -X POST http://localhost:2004/api/webhook/psp -H "Content-Type: application/json" -H "x-webhook-secret: replace_with_secret" -d '{"txnId":"<txnId>","status":"PAID","pspData":{}}'

This will update the transaction status to PAID and also set the order status to PAID.

Notes and limitations

- The UPI deep-link + QR will open the UPI app with amount prefilled, but the backend cannot confirm the payment without a PSP webhook.
- For production, create an account with a PSP (Razorpay/Cashfree/Paytm), use their SDK to create orders and verify payments, and verify webhooks using their signature verification.
- The webhook endpoint here uses a simple shared-secret model for prototypes only.

MongoDB Atlas
----------------
You can (and probably should) use MongoDB Atlas for remote development or production. Create a free Atlas cluster, add a database user, and whitelist your IP or use VPC peering. Then set `MONGO_URI` in your `.env` using the Atlas connection string. See MongoDB Atlas docs for details.

Security — do NOT send bank details here
-------------------------------------------------
- Never share raw bank account numbers, UPI credentials, or private keys in source control or chat. I cannot accept or store real bank credentials for you.
- For production UPI payments, use a reputable PSP (Razorpay/Cashfree/Paytm). They will provide API keys and a secure way to collect payments, and they handle settlement to your bank.
- If you want me to integrate with a PSP, provide which provider and I'll add SDK integration and instructions for where to put API keys (in `.env`). Do not paste any secret keys directly into chat — instead paste them into your `.env` locally.

Dev helpers
-----------
- To create test orders directly in the database from the running server, enable dev routes by adding this to your `.env`:

   ENABLE_DEV_ROUTES=true

   Then POST to `/api/dev/order` with JSON `{ "orderId":"ORD123","totalAmount":1234.5 }` to create a test order in whatever DB the server is connected to (Atlas).

- During development you can show detailed error messages by setting:

   DEV_SHOW_ERRORS=true

   This will include the underlying error message in 500 responses (do NOT enable in production).

Files added
- server.js — entrypoint and Express app
- models/Transaction.js — Transaction Mongoose model (TTL index)
- models/Order.js — Simple Order model for validation
- routes/checkout.js — checkout endpoint
- routes/webhook.js — PSP webhook endpoint
- utils/upi.js — builds UPI deep-link and creates QR data URL
- .env.example — environment variables

Next steps
- Implement GET /api/txn/:txnId to return transaction details
- Integrate with a PSP SDK and replace shared-secret webhook verification with signature verification
- Add tests and basic input validation with express-validator
