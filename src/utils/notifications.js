// Notification utility functions for WhatsApp and SMS

/**
 * Send WhatsApp message using WhatsApp Web API
 * @param {string} phone - Phone number with country code
 * @param {string} message - Message to send
 * @param {string} orderId - Order ID
 * @param {string} transactionId - Transaction ID
 * @param {number} amount - Order amount
 * @param {Array} items - Order items
 * @param {string} customerName - Customer name
 */
export const sendWhatsAppMessage = (phone, message, orderId, transactionId, amount, items, customerName) => {
  try {
    // Format phone number (remove any non-digit characters and ensure it starts with country code)
    const formattedPhone = phone.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.startsWith('91') ? formattedPhone : `91${formattedPhone}`;
    
    // Create WhatsApp message with order details
    const whatsappMessage = `🎉 *Order Confirmed!* 🎉

*Order Details:*
📋 Order ID: ${orderId}
💳 Transaction ID: ${transactionId}
💰 Amount: ₹${amount}
📱 Customer: ${customerName || 'Customer'}
📞 Phone: ${phone}

*Items Ordered:*
${items.map(item => `• ${item.name} (${item.weight}g) - ₹${item.price * item.quantity}`).join('\n')}

*Total: ₹${amount}*

Thank you for choosing Taaza Fresh Meat! 🥩

For any queries, contact us at: +91-9876543210`;

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    console.log('WhatsApp message opened for:', phone);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

/**
 * Send SMS using Firebase Cloud Function
 * @param {string} phone - Phone number
 * @param {string} message - Message to send
 * @param {string} orderId - Order ID
 * @param {string} transactionId - Transaction ID
 * @param {string} customerName - Customer name
 */
export const sendSMS = async (phone, message, orderId, transactionId, customerName) => {
  try {
    // Call Firebase Cloud Function to send SMS
    const response = await fetch('https://us-central1-taaza-5c5cd.cloudfunctions.net/sendSMS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        orderId: orderId,
        transactionId: transactionId,
        customerName: customerName
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('SMS sent successfully to:', phone);
      return true;
    } else {
      console.error('SMS sending failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    // Log to console for debugging (in production, you might want to log to a service)
    console.log('SMS would have been sent to:', phone);
    console.log('SMS message:', message);
    
    // Return false to indicate failure, but don't break the app
    return false;
  }
};

/**
 * Send WhatsApp message using Firebase Cloud Function
 * @param {string} phone - Phone number
 * @param {string} message - Message to send
 * @param {string} orderId - Order ID
 * @param {string} transactionId - Transaction ID
 * @param {string} customerName - Customer name
 */
export const sendWhatsAppViaAPI = async (phone, message, orderId, transactionId, customerName) => {
  try {
    // Call Firebase Cloud Function to send WhatsApp message
    const response = await fetch('https://us-central1-taaza-5c5cd.cloudfunctions.net/sendWhatsApp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: phone,
        message: message,
        orderId: orderId,
        transactionId: transactionId,
        customerName: customerName
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('WhatsApp message sent successfully to:', phone);
      return true;
    } else {
      console.error('WhatsApp sending failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
};

/**
 * Send both WhatsApp and SMS notifications
 * @param {string} phone - Phone number
 * @param {string} orderId - Order ID
 * @param {string} transactionId - Transaction ID
 * @param {number} amount - Order amount
 * @param {Array} items - Order items
 * @param {string} customerName - Customer name
 */
export const sendOrderNotifications = async (phone, orderId, transactionId, amount, items, customerName) => {
  try {
    // Send WhatsApp message (opens WhatsApp Web)
    sendWhatsAppMessage(phone, '', orderId, transactionId, amount, items, customerName);
    
    // Try to send SMS via Cloud Function, but don't fail if it doesn't work
    try {
      const smsMessage = `Thank you for your order! Order ID: ${orderId}, Amount: ₹${amount}, Transaction ID: ${transactionId}. Taaza Fresh Meat`;
      await sendSMS(phone, smsMessage, orderId, transactionId, customerName);
    } catch (smsError) {
      console.log('SMS notification failed (cloud function not available), but order was successful');
      console.log('SMS would have been sent to:', phone);
    }
    
    console.log('Order notifications sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending order notifications:', error);
    return false;
  }
};

/**
 * Format phone number for WhatsApp
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
export const formatPhoneForWhatsApp = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.startsWith('91') ? cleaned : `91${cleaned}`;
};

/**
 * Create order summary message
 * @param {string} orderId - Order ID
 * @param {string} transactionId - Transaction ID
 * @param {number} amount - Order amount
 * @param {Array} items - Order items
 * @param {string} customerName - Customer name
 * @returns {string} Formatted message
 */
export const createOrderSummary = (orderId, transactionId, amount, items, customerName) => {
  return `🎉 *Order Confirmed!* 🎉

*Order Details:*
📋 Order ID: ${orderId}
💳 Transaction ID: ${transactionId}
💰 Amount: ₹${amount}
📱 Customer: ${customerName || 'Customer'}

*Items Ordered:*
${items.map(item => `• ${item.name} (${item.weight}g) - ₹${item.price * item.quantity}`).join('\n')}

*Total: ₹${amount}*

Thank you for choosing Taaza Fresh Meat! 🥩

For any queries, contact us at: +91-9876543210`;
};

/**
 * Clean up blob URLs to prevent memory leaks
 * @param {string} orderId - Order ID
 * @param {string} blobUrl - Blob URL to revoke
 */
export const cleanupBlobUrl = (orderId, blobUrl) => {
  try {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
      console.log('Blob URL cleaned up for order:', orderId);
    }
    
    // Remove cleanup flag from localStorage
    const cleanupKey = `bill_cleanup_${orderId}`;
    localStorage.removeItem(cleanupKey);
  } catch (error) {
    console.error('Error cleaning up blob URL:', error);
  }
};

/**
 * Clean up all blob URLs for orders
 */
export const cleanupAllBlobUrls = () => {
  try {
    const keys = Object.keys(localStorage);
    const cleanupKeys = keys.filter(key => key.startsWith('bill_cleanup_'));
    
    cleanupKeys.forEach(key => {
      const orderId = key.replace('bill_cleanup_', '');
      localStorage.removeItem(key);
      console.log('Cleaned up blob URL for order:', orderId);
    });
  } catch (error) {
    console.error('Error cleaning up blob URLs:', error);
  }
}; 