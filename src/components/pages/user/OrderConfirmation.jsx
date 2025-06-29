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
      
      try {
        // First, try to fetch by document ID (most common case)
        const docRef = doc(db, 'orders', orderId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setOrder(docSnap.data());
          setLoading(false);
          return;
        }
        
        // If not found by document ID, try to find by sequential order ID
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('orderId', '==', orderId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0];
          setOrder(orderDoc.data());
        }
        
      } catch (error) {
        console.error('Error fetching order:', error);
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

  // Format date and time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return { date: 'N/A', time: 'N/A', full: 'N/A' };
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-IN'),
      time: date.toLocaleTimeString('en-IN'),
      full: date.toLocaleString('en-IN')
    };
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
  const dateTime = formatDateTime(order.createdAt);
  const totalWeight = order.cart?.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || 0;

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 max-w-4xl mx-auto main-content">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
        <p className="text-gray-600">Your order has been confirmed and payment processed.</p>
        <div className="mt-4">
          <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold">
            Order #{order.orderId || orderId}
          </span>
        </div>
      </div>

      {/* Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            📝 Order Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Order ID:</span>
              <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded">
                #{order.orderId || orderId}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Date:</span>
              <span className="font-semibold text-gray-800">{dateTime.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Time:</span>
              <span className="font-semibold text-gray-800">{dateTime.time}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Status:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Source:</span>
              <span className="font-semibold text-gray-800 capitalize">
                {order.source || 'Online'}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            💳 Payment Information
          </h2>
          <div className="space-y-3">
            {order.paymentId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Payment ID:</span>
                <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded break-all">
                  {order.paymentId}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Method:</span>
              <span className="font-semibold text-gray-800 capitalize">
                {order.paymentMethod || 'Razorpay'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Total Amount:</span>
              <span className="font-bold text-xl text-green-600">₹{total}</span>
            </div>
            {order.razorpayOrderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Razorpay Order:</span>
                <span className="font-mono text-xs text-gray-800 bg-gray-100 px-2 py-1 rounded break-all">
                  {order.razorpayOrderId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
            👤 Customer Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Name:</span>
              <span className="font-semibold text-gray-800">{order.user?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Phone:</span>
              <span className="font-semibold text-gray-800">{order.user?.phone}</span>
            </div>
            {order.user?.email && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Email:</span>
                <span className="font-semibold text-gray-800 break-all">{order.user.email}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Items Count:</span>
              <span className="font-semibold text-gray-800">{order.cart?.length || 0} items</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items - Enhanced */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
          🛒 Order Items ({order.cart?.length || 0} items)
        </h2>
        <div className="space-y-4">
          {order.cart?.map((item, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Item Details */}
                <div className="md:col-span-2">
                  <div className="font-semibold text-gray-800 text-lg mb-2">
                    {item.name}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 font-medium">Weight:</span>
                      <span className="ml-2 text-gray-800 font-semibold">{item.weight}g</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Quantity:</span>
                      <span className="ml-2 text-gray-800 font-semibold">{item.quantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Price per kg:</span>
                      <span className="ml-2 text-gray-800 font-semibold">₹{item.price}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 font-medium">Total Weight:</span>
                      <span className="ml-2 text-gray-800 font-semibold">{(item.weight * item.quantity)}g</span>
                    </div>
                  </div>
                </div>
                
                {/* Price Information */}
                <div className="text-right">
                  <div className="font-bold text-green-600 text-xl">
                    ₹{item.price * item.quantity}
                  </div>
                  <div className="text-gray-500 text-sm">
                    ₹{item.price}/kg
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {item.weight}g × {item.quantity}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-6 mb-6 border-2 border-green-300">
        <h2 className="text-xl font-bold mb-4 text-green-800 flex items-center">
          📊 Order Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-green-600 font-medium">Total Items</div>
            <div className="font-bold text-2xl text-green-800">{order.cart?.length || 0}</div>
          </div>
          <div className="text-center">
            <div className="text-green-600 font-medium">Total Weight</div>
            <div className="font-bold text-2xl text-green-800">{totalWeight}g</div>
          </div>
          <div className="text-center">
            <div className="text-green-600 font-medium">Total Amount</div>
            <div className="font-bold text-2xl text-green-800">₹{total}</div>
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
            className="flex-1 bg-blue-600 text-white text-center px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
            download={order.billType === 'blob' ? `Taaza-Bill-${order.orderId || orderId}.pdf` : undefined}
            onClick={handleBillDownload}
          >
            📄 Download E-Bill
          </a>
        ) : (
          <div className="flex-1 bg-gray-100 text-gray-600 text-center px-6 py-3 rounded-lg">
            📄 E-Bill Generating...
          </div>
        )}
        
        <Link 
          to="/orders" 
          className="flex-1 bg-green-600 text-white text-center px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
        >
          📋 View All Orders
        </Link>
        
        <Link 
          to="/" 
          className="flex-1 bg-gray-600 text-white text-center px-6 py-3 rounded-lg hover:bg-gray-700 transition font-semibold"
        >
          🛒 Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default OrderConfirmation; 