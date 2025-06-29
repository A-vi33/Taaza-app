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

// Send SMS notification
exports.sendSMS = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { phone, message, orderId, transactionId, customerName } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
      }

      // For now, we'll just log the SMS
      // In production, integrate with Twilio, AWS SNS, or any SMS service
      console.log(`SMS sent to ${phone}: ${message}`);
      
      // Example Twilio integration (uncomment and configure):
      // const twilio = require('twilio');
      // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      // const result = await client.messages.create({
      //   body: message,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   to: phone
      // });

      // Log the SMS to Firestore for tracking
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      
      await admin.firestore().collection('sms_logs').add({
        phone: phone,
        message: message,
        orderId: orderId,
        transactionId: transactionId,
        customerName: customerName,
        status: 'sent',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'SMS sent successfully'
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

// Send WhatsApp message (using WhatsApp Business API)
exports.sendWhatsApp = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { phone, message, orderId, transactionId, customerName } = req.body;

      if (!phone || !message) {
        return res.status(400).json({ error: 'Phone and message are required' });
      }

      // For now, we'll just log the WhatsApp message
      // In production, integrate with WhatsApp Business API
      console.log(`WhatsApp message to ${phone}: ${message}`);
      
      // Example WhatsApp Business API integration (uncomment and configure):
      // const axios = require('axios');
      // const result = await axios.post('https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages', {
      //   messaging_product: 'whatsapp',
      //   to: phone,
      //   type: 'text',
      //   text: { body: message }
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      //     'Content-Type': 'application/json'
      //   }
      // });

      // Log the WhatsApp message to Firestore for tracking
      const admin = require('firebase-admin');
      if (!admin.apps.length) {
        admin.initializeApp();
      }
      
      await admin.firestore().collection('whatsapp_logs').add({
        phone: phone,
        message: message,
        orderId: orderId,
        transactionId: transactionId,
        customerName: customerName,
        status: 'sent',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      res.json({
        success: true,
        message: 'WhatsApp message sent successfully'
      });
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});