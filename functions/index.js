const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const CryptoJS = require("crypto-js");
const Razorpay = require("razorpay");

const accessCode = process.env.CCAVENUE_ACCESS_CODE;
const workingKey = process.env.CCAVENUE_WORKING_KEY;
const merchantId = process.env.CCAVENUE_MERCHANT_ID;
const redirectUrl = process.env.CCAVENUE_REDIRECT_URL;
const cancelUrl = process.env.CCAVENUE_CANCEL_URL;

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_Ty2fPZgb35aMIa',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key'
});

exports.createCCAvenuePayment = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    const { amount, order_id, customer_name, customer_email, customer_phone } = req.body;

    // Prepare the data string
    const data = `merchant_id=${merchantId}&order_id=${order_id}&currency=INR&amount=${amount}&redirect_url=${redirectUrl}&cancel_url=${cancelUrl}&language=EN&billing_name=${customer_name}&billing_email=${customer_email}&billing_tel=${customer_phone}`;

    // Encrypt the data string using AES
    const encrypted = CryptoJS.AES.encrypt(data, workingKey).toString();

    res.json({
      encRequest: encrypted,
      accessCode: accessCode,
      ccavenueUrl: "https://test.ccavenue.com/transaction/transaction.do?command=initiateTransaction"
    });
  });
});

// Create Razorpay order
exports.createRazorpayOrder = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { amount, currency = 'INR', receipt } = req.body;

      if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
      }

      const options = {
        amount: amount, // amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`
      };

      const order = await razorpay.orders.create(options);
      
      res.json({
        success: true,
        order: order
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});