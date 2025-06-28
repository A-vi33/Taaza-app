import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import OrderDetailsModal from '../user/OrderDetailsModal';

// Toast notification component
function Toast({ message, show, onClose, type = 'success' }) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 transition-all duration-500 ${show ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20'} ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded shadow-lg flex items-center gap-2`}
      style={{ pointerEvents: show ? 'auto' : 'none' }}
    >
      {type === 'success' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      <span>{message}</span>
      <button className="ml-2 text-white/80 hover:text-white" onClick={onClose}>&times;</button>
    </div>
  );
}

function AdminOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching orders...');
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Orders fetched:', ordersData.length);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showToast('Error loading orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Filter orders by search, status, and date
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cart?.[0]?.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesDate = !dateFilter || 
      (order.createdAt?.toDate?.()?.toISOString().slice(0, 10) === dateFilter);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Calculate pending orders
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleFulfill = async (orderId, fulfilled) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        fulfilled: fulfilled,
        fulfilledAt: fulfilled ? new Date() : null
      });
      showToast(`Order ${fulfilled ? 'marked as fulfilled' : 'marked as unfulfilled'}`);
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error updating order:', error);
      showToast('Error updating order', 'error');
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-white">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-6xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Enhanced Page Header */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    📋
                  </div>
                  Order Management
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Track, manage, and fulfill customer orders efficiently
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📦 {orders.length} Orders
                </div>
                <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  ⏳ {pendingOrders} Pending
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔍
            </div>
            Filter Orders
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search by order ID or customer name..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
              className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>
        
        {/* Orders List */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              📋
            </div>
            Order History
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading orders...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                📭 No orders found
              </div>
              <p className="text-slate-500 responsive-text-sm mt-2" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                {searchTerm || statusFilter || dateFilter ? 'Try adjusting your filters.' : 'Orders will appear here once customers make purchases.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => (
                <div key={order.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 hover:bg-slate-200/50 transition-colors shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-900 responsive-text-lg" 
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Order #{order.id.slice(-8)}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : order.status === 'fulfilled' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-red-100 text-red-800'
                        }`} 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                          {order.status === 'paid' ? '✅ Paid' : order.status === 'pending' ? '⏳ Pending' : order.status === 'fulfilled' ? '📦 Fulfilled' : '❌ Cancelled'}
                        </span>
                        {order.fulfilled && (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800" 
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                            ✅ Fulfilled
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Total Amount:
                          </p>
                          <p className="font-bold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            ₹{order.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Items:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.cart?.length || 0} items
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Date:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Time:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {order.cart && order.cart.length > 0 && order.cart[0]?.customerInfo && (
                        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200">
                          <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Customer Details:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.cart[0].customerInfo.name} ({order.cart[0].customerInfo.phone})
                            {order.cart[0].customerInfo.email && ` | ${order.cart[0].customerInfo.email}`}
                          </p>
                        </div>
                      )}
                      
                      {order.cart && order.cart.length > 0 && (
                        <div className="mt-3">
                          <p className="text-slate-600 font-medium mb-2" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Items Ordered:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {order.cart.map((item, index) => (
                              <span key={index} className="bg-slate-200 text-slate-800 px-2 py-1 rounded-lg text-xs font-medium" 
                                    style={{ fontFamily: 'Inter, sans-serif' }}>
                                {item.name} ({item.weight}g) x{item.quantity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleViewDetails(order)} 
                        className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 transition shadow-sm font-semibold" 
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        View Details
                      </button>
                      {order.status === 'paid' && !order.fulfilled && (
                        <button 
                          onClick={() => handleFulfill(order.id, true)} 
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition shadow-sm font-semibold" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Mark Fulfilled
                        </button>
                      )}
                      {order.fulfilled && (
                        <button 
                          onClick={() => handleFulfill(order.id, false)} 
                          className="bg-yellow-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-yellow-700 transition shadow-sm font-semibold" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Mark Unfulfilled
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
}

export default AdminOrders; 