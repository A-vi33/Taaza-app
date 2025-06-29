import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { cleanupBlobUrl } from '../../../utils/notifications';

function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return;
      setLoading(true);
      const docRef = doc(db, 'orders', orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder(docSnap.data());
      }
      setLoading(false);
    }
    fetchOrder();
  }, [orderId]);

  const handleBillDownload = () => {
    if (order?.billType === 'blob' && order?.billUrl) {
      // Clean up blob URL after download
      setTimeout(() => {
        cleanupBlobUrl(orderId, order.billUrl);
      }, 5000); // Clean up after 5 seconds
    }
  };

  if (loading) return (
    <div className="responsive-container responsive-p-8 text-center main-content">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
      <p>Loading order details...</p>
    </div>
  );
  
  if (!order) return (
    <div className="responsive-container responsive-p-8 text-center text-red-600 main-content">
      <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
      <p>The order you're looking for doesn't exist.</p>
      <Link to="/" className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
        Back to Home
      </Link>
    </div>
  );

  const total = order.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 max-w-2xl mx-auto main-content">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Your order has been confirmed and payment processed.</p>
      </div>

      {/* Order Details Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Order Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-mono font-semibold text-gray-800">{orderId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment ID</p>
            <p className="font-mono font-semibold text-gray-800">{order.paymentId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Order Date</p>
            <p className="font-semibold text-gray-800">
              {order.createdAt?.toDate?.().toLocaleString() || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {order.status === 'paid' ? 'Paid' : 'Pending'}
            </span>
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">Customer</p>
          <p className="font-semibold text-gray-800">{order.user?.name}</p>
          <p className="text-sm text-gray-600">{order.user?.phone}</p>
          {order.user?.email && <p className="text-sm text-gray-600">{order.user.email}</p>}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Order Items</h2>
        <div className="space-y-3">
          {order.cart?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
              <div>
                <p className="font-semibold text-gray-800">{item.name}</p>
                <p className="text-sm text-gray-600">{item.weight}g × {item.quantity}</p>
              </div>
              <p className="font-semibold text-gray-800">₹{item.price * item.quantity}</p>
            </div>
          ))}
        </div>
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-gray-800">Total Amount</span>
            <span className="text-2xl font-bold text-green-600">₹{total}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        {order.billUrl ? (
          <a 
            href={order.billUrl} 
            target={order.billType === 'blob' ? undefined : '_blank'}
            rel={order.billType === 'blob' ? undefined : 'noopener noreferrer'}
            className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            download={order.billType === 'blob' ? `Taaza-Bill-${orderId}.pdf` : undefined}
            onClick={handleBillDownload}
          >
            📄 Download E-Bill (PDF)
          </a>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-600 text-center px-6 py-3 rounded-lg font-semibold">
            📄 E-Bill Generating...
          </div>
        )}
        
        <Link 
          to="/orders" 
          className="flex-1 bg-green-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          📋 View All Orders
        </Link>
        
        <Link 
          to="/" 
          className="flex-1 bg-gray-600 text-white text-center px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          🛒 Continue Shopping
        </Link>
      </div>

      {/* Order Added Notification */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-green-800">Order Added to Your Account</h3>
            <p className="text-sm text-green-600">
              Your order has been saved to your account. You can view all your orders anytime from the Orders page.
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Share */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Share your order details</p>
        <a 
          href={`https://wa.me/?text=${encodeURIComponent(`🎉 Order Confirmed! Order ID: ${orderId}, Amount: ₹${total}. Thank you for choosing Taaza Fresh Meat!`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
        >
          📱 Share on WhatsApp
        </a>
      </div>
    </div>
  );
}

export default OrderConfirmation; 