const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const CryptoJS = require("crypto-js");

const accessCode = process.env.CCAVENUE_ACCESS_CODE;
const workingKey = process.env.CCAVENUE_WORKING_KEY;
const merchantId = process.env.CCAVENUE_MERCHANT_ID;
const redirectUrl = process.env.CCAVENUE_REDIRECT_URL;
const cancelUrl = process.env.CCAVENUE_CANCEL_URL;

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