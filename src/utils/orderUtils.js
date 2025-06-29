import { db } from '../firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

/**
 * Generate a sequential order ID between 10000 and 1000000
 * @returns {Promise<string>} The generated order ID
 */
export const generateOrderId = async () => {
  try {
    // Get the latest order to find the highest order ID
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('orderId', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    let nextOrderId = 10000; // Default starting ID
    
    if (!querySnapshot.empty) {
      const latestOrder = querySnapshot.docs[0].data();
      const currentOrderId = parseInt(latestOrder.orderId);
      
      // Validate that the current order ID is within our range
      if (currentOrderId >= 10000 && currentOrderId <= 1000000) {
        nextOrderId = currentOrderId + 1;
      } else {
        // If current order ID is invalid, start from 10000
        console.warn('Invalid order ID found in database:', currentOrderId, 'Starting from 10000');
        nextOrderId = 10000;
      }
      
      // If we reach 1000000, reset to 10000
      if (nextOrderId > 1000000) {
        console.log('Order ID reached maximum (1000000), resetting to 10000');
        nextOrderId = 10000;
      }
    } else {
      // No orders exist yet, start with 10000
      console.log('No existing orders found, starting with order ID: 10000');
    }
    
    console.log(`Generated sequential order ID: ${nextOrderId}`);
    return nextOrderId.toString();
    
  } catch (error) {
    console.error('Error generating order ID:', error);
    
    // Fallback: generate based on timestamp but ensure it's within range
    const timestamp = Date.now();
    const fallbackId = 10000 + (timestamp % 990000); // Ensures ID is between 10000-1000000
    console.log(`Using fallback order ID: ${fallbackId}`);
    return fallbackId.toString();
  }
};

/**
 * Create a print-ready order receipt
 * @param {Object} order - Order object
 * @param {Array} cartItems - Cart items
 * @param {string} customerName - Customer name
 * @param {string} customerPhone - Customer phone
 * @returns {string} HTML string for printing
 */
export const createPrintReceipt = (order, cartItems, customerName, customerPhone) => {
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const currentDate = new Date().toLocaleString('en-IN');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Taaza Fresh Meat - Receipt</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          margin: 0; 
          padding: 20px; 
          font-size: 12px;
          line-height: 1.4;
        }
        .header { text-align: center; margin-bottom: 20px; }
        .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 14px; margin-bottom: 10px; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .item { margin: 5px 0; }
        .total { font-weight: bold; margin-top: 10px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">TAAZA FRESH MEAT</div>
        <div class="subtitle">Fresh Meat & Fish Market</div>
        <div>Order Receipt</div>
      </div>
      
      <div class="divider"></div>
      
      <div class="item"><strong>Order ID:</strong> ${order.orderId}</div>
      <div class="item"><strong>Date:</strong> ${currentDate}</div>
      <div class="item"><strong>Customer:</strong> ${customerName}</div>
      <div class="item"><strong>Phone:</strong> ${customerPhone}</div>
      
      <div class="divider"></div>
      
      <div class="item"><strong>ITEMS:</strong></div>
      ${cartItems.map(item => `
        <div class="item">
          ${item.name} (${item.weight}g) × ${item.quantity} = ₹${item.price * item.quantity}
        </div>
      `).join('')}
      
      <div class="divider"></div>
      
      <div class="total">TOTAL: ₹${total}</div>
      <div class="item">Payment: CASH</div>
      
      <div class="divider"></div>
      
      <div class="footer">
        Thank you for choosing Taaza Fresh Meat!<br>
        For any queries, contact us at: +91-9876543210<br>
        Visit us again!
      </div>
      
      <div class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()">🖨️ Print Receipt</button>
        <button onclick="window.close()">❌ Close</button>
      </div>
    </body>
    </html>
  `;
};

/**
 * Open print window with order receipt
 * @param {Object} order - Order object
 * @param {Array} cartItems - Cart items
 * @param {string} customerName - Customer name
 * @param {string} customerPhone - Customer phone
 */
export const printOrderReceipt = (order, cartItems, customerName, customerPhone) => {
  const receiptHtml = createPrintReceipt(order, cartItems, customerName, customerPhone);
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  printWindow.document.write(receiptHtml);
  printWindow.document.close();
  
  // Auto-print after a short delay
  setTimeout(() => {
    printWindow.print();
  }, 500);
}; 