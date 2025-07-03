import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';

function Orders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [showNewOrderNotification, setShowNewOrderNotification] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.type !== 'customer')) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user?.mobile) return;
    
    setLoading(true);
    
    // Create real-time listener for orders
    const q = query(
      collection(db, 'orders'),
      where('user.phone', '==', user.mobile)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort orders by creation date (newest first)
      const sortedOrders = ordersData.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
      
      // Check if new orders were added
      if (sortedOrders.length > orders.length && orders.length > 0) {
        setShowNewOrderNotification(true);
        setTimeout(() => setShowNewOrderNotification(false), 5000); // Hide after 5 seconds
      }
      
      setOrders(sortedOrders);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching orders:', error);
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user, orders.length]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="responsive-container responsive-p-4 sm:responsive-p-8 main-content bg-green-100 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 main-content bg-green-100 min-h-screen">
      {/* New Order Notification */}
      {showNewOrderNotification && (
        <div className="mb-4 p-4 bg-green-200 border border-green-300 rounded-lg animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">New Order Added!</p>
              <p className="text-xs text-green-600">Your latest order has been added to the list below.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Orders</h1>
        <Link 
          to="/" 
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
        >
          🛒 Continue Shopping
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-800 mb-2">No Orders Yet</h2>
          <p className="text-green-600 mb-4">Start shopping to see your orders here</p>
          <Link 
            to="/" 
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const total = order.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
            const isExpanded = expandedOrder === order.id;
            
            return (
              <div key={order.id} className="bg-yellow-100 rounded-lg shadow-lg overflow-hidden">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800">Order #{order.orderId || order.id.slice(-8)}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.source && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {order.source}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {order.createdAt?.toDate?.().toLocaleDateString() || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {order.createdAt?.toDate?.().toLocaleTimeString() || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Items:</span> {order.cart?.length || 0} items
                        </div>
                        <div>
                          <span className="font-medium">Weight:</span> {order.cart?.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || 0}g
                        </div>
                      </div>
                      {order.paymentId && (
                        <p className="text-xs text-gray-500 mt-2">
                          Payment ID: {order.paymentId}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{total}</p>
                        <p className="text-sm text-gray-600">{order.cart?.length || 0} items</p>
                      </div>
                      
                      <button
                        onClick={() => toggleOrderDetails(order.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Order Details */}
                {isExpanded && (
                  <div className="p-6 bg-green-50">
                    {/* Order Items */}
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-800 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {order.cart?.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                <div className="font-semibold text-gray-800 mb-2">{item.name}</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Weight:</span>
                                    <span className="ml-2 font-semibold">{item.weight}g</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Quantity:</span>
                                    <span className="ml-2 font-semibold">{item.quantity}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Price per kg:</span>
                                    <span className="ml-2 font-semibold">₹{item.price}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Total Weight:</span>
                                    <span className="ml-2 font-semibold">{(item.weight * item.quantity)}g</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-600 text-lg">₹{item.price * item.quantity}</div>
                                <div className="text-gray-500 text-sm">₹{item.price}/kg</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {order.billUrl ? (
                        <a 
                          href={order.billUrl} 
                          target={order.billType === 'blob' ? undefined : '_blank'}
                          rel={order.billType === 'blob' ? undefined : 'noopener noreferrer'}
                          className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                          download={order.billType === 'blob' ? `Taaza-Bill-${order.orderId || order.id}.pdf` : undefined}
                        >
                          📄 Download E-Bill
                        </a>
                      ) : (
                        <div className="flex-1 bg-yellow-100 text-yellow-800 text-center px-4 py-2 rounded-lg">
                          📄 E-Bill Generating...
                        </div>
                      )}
                      
                      <Link 
                        to={`/order-confirmation?orderId=${order.id}`}
                        className="flex-1 bg-green-600 text-white text-center px-4 py-2 rounded-lg hover:bg-green-700 transition"
                      >
                        📋 View Details
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Orders;   