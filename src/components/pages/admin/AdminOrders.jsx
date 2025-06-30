import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy, deleteDoc } from 'firebase/firestore';
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
      <button className="ml-2 text-white/80 hover:text-white" onClick={onClose}>×</button>
    </div>
  );
}

function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

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
      order.orderId?.toString().includes(searchTerm) ||
      order.cart?.[0]?.customerInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.source?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesSource = !sourceFilter || order.source === sourceFilter;
    const matchesDate = !dateFilter || 
      (order.createdAt?.toDate?.()?.toISOString().slice(0, 10) === dateFilter);
    return matchesSearch && matchesStatus && matchesSource && matchesDate;
  });

  // Calculate pending orders (include both pending and confirmed statuses)
  const pendingOrders = orders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const confirmDeleteOrder = (order) => {
    setOrderToDelete(order);
    setDeleteModalOpen(true);
  };

  const executeDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      const orderRef = doc(db, 'orders', orderToDelete.id);
      await deleteDoc(orderRef);
      showToast('Order deleted successfully', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      showToast('Error deleting order', 'error');
    } finally {
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Enhanced Page Header */}
        <div className="mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-3 flex items-center gap-3">
                  Order Management System
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium mb-4">
                  Track, manage, and fulfill customer orders efficiently with real-time updates
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
                    <div className="text-sm text-blue-700 font-medium">Total Orders</div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
                    <div className="text-sm text-yellow-700 font-medium">Pending</div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">
                      {orders.filter(o => o.status === 'paid' || o.status === 'confirmed').length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Active</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                  <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                    🟢 System Online
                  </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                    📊 Live Data
                  </div>
                </div>
                <div className="text-right text-sm text-slate-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Filters Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8 animate-fade-in">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔍
            </div>
            Advanced Order Filters
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Search Orders</label>
            <input 
              type="text" 
                placeholder="Search by order ID, customer name, or source..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
                className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <option value="">All Status</option>
                <option value="pending">⏳ Pending</option>
                <option value="confirmed">🏪 Confirmed (Offline)</option>
                <option value="paid">✅ Paid</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Source</label>
              <select 
                value={sourceFilter} 
                onChange={(e) => setSourceFilter(e.target.value)} 
                className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                <option value="">All Sources</option>
                <option value="admin">🏪 Admin</option>
                <option value="online">🌐 Online</option>
            </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)} 
                className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="mt-4 flex flex-wrap gap-2">
            {searchTerm && (
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Search: "{searchTerm}"
              </span>
            )}
            {statusFilter && (
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Status: {statusFilter}
              </span>
            )}
            {sourceFilter && (
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                Source: {sourceFilter}
              </span>
            )}
            {dateFilter && (
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                Date: {dateFilter}
              </span>
            )}
            {(searchTerm || statusFilter || sourceFilter || dateFilter) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setSourceFilter('');
                  setDateFilter('');
                }}
                className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-red-200 transition"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
        
        {/* Enhanced Orders List */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              📋
            </div>
              Order History ({filteredOrders.length} orders)
          </h3>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
              <button 
                onClick={fetchOrders}
                className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 transition shadow-sm font-semibold flex items-center gap-2"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
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
            <div className="space-y-6">
              {filteredOrders.map(order => {
                const total = order.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                const totalWeight = order.cart?.reduce((sum, item) => sum + (item.weight * item.quantity), 0) || 0;
                const isExpanded = expandedOrder === order.id;
                
                return (
                  <div key={order.id} className="group relative bg-yellow-100 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                    {/* Order Header */}
                    <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                          {/* Order ID and Status Row */}
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <h4 className="font-bold text-slate-900 responsive-text-lg flex items-center gap-2" 
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                              <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-sm font-mono">
                                #{order.orderId || order.id.slice(-8)}
                              </span>
                        </h4>
                            
                            {/* Status Badges */}
                            <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          order.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : order.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : order.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-red-100 text-red-800'
                        }`} 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                                {order.status === 'paid' ? '✅ Paid' : 
                                 order.status === 'pending' ? '⏳ Pending' : 
                                 order.status === 'confirmed' ? '🏪 Offline' : '❌ Cancelled'}
                              </span>
                              
                              {order.source && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                  order.source === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                                }`} 
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {order.source === 'admin' ? '🏪 Admin' : '🌐 Online'}
                        </span>
                              )}
                            </div>
                      </div>
                      
                          {/* Order Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Total Amount:
                          </p>
                              <p className="font-bold text-slate-900 text-lg" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                                ₹{total}
                          </p>
                        </div>
                        
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Items:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.cart?.length || 0} items
                          </p>
                        </div>
                        
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                                Weight:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                                {totalWeight}g
                          </p>
                        </div>
                        
                            <div className="bg-slate-50 rounded-lg p-3">
                              <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                                Date & Time:
                          </p>
                          <p className="font-semibold text-slate-900" 
                                 style={{ fontFamily: 'Inter, sans-serif' }}>
                                {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                              </p>
                              <p className="text-xs text-slate-600" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {order.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 min-w-fit">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                              {/* Action buttons */}
                              <div className="flex items-center gap-2 mt-2">
                                <button
                                  onClick={() => toggleOrderDetails(order.id)}
                                  className="text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-md px-3 py-1.5 transition-all shadow-sm"
                                >
                                  {expandedOrder === order.id ? 'Hide' : 'Show'} Details
                                </button>
                                <button
                                  onClick={() => confirmDeleteOrder(order)}
                                  className="text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md px-3 py-1.5 transition-all shadow-sm"
                                >
                                  Delete Order
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Information - Conditional */}
                    {expandedOrder === order.id && (
                      <div className="p-6 bg-slate-50 border-b border-slate-200">
                        <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2" 
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                          👤 Customer Information
                        </h5>
                        
                        {order.cart && order.cart.length > 0 && order.cart[0]?.customerInfo && (
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-slate-600 font-medium" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Name:
                                </span>
                                <span className="ml-2 font-semibold text-slate-900" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {order.cart[0].customerInfo.name}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-600 font-medium" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Phone:
                                </span>
                                <span className="ml-2 font-semibold text-slate-900" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {order.cart[0].customerInfo.phone}
                                </span>
                              </div>
                              {order.cart[0].customerInfo.email && (
                                <div>
                                  <span className="text-slate-600 font-medium" 
                                        style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Email:
                                  </span>
                                  <span className="ml-2 font-semibold text-slate-900 break-all" 
                                        style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {order.cart[0].customerInfo.email}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {order.customerName && (
                          <div className="bg-white rounded-lg p-4 border border-slate-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <span className="text-slate-600 font-medium" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Name:
                                </span>
                                <span className="ml-2 font-semibold text-slate-900" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {order.customerName}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-600 font-medium" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  Phone:
                                </span>
                                <span className="ml-2 font-semibold text-slate-900" 
                                      style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {order.customerPhone || 'N/A'}
                                </span>
                              </div>
                              {order.customerEmail && (
                                <div>
                                  <span className="text-slate-600 font-medium" 
                                        style={{ fontFamily: 'Inter, sans-serif' }}>
                                    Email:
                                  </span>
                                  <span className="ml-2 font-semibold text-slate-900 break-all" 
                                        style={{ fontFamily: 'Inter, sans-serif' }}>
                                    {order.customerEmail}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Items Preview - Conditional */}
                    {expandedOrder === order.id && (
                      <div className="p-6">
                        <h5 className="font-semibold text-slate-800 mb-3 flex items-center gap-2" 
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                          🛒 Order Items ({order.cart?.length || 0} items)
                        </h5>
                        
                        {order.cart && order.cart.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {order.cart.map((item, index) => (
                              <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                <div className="font-semibold text-slate-900 mb-2" 
                                     style={{ fontFamily: 'Inter, sans-serif' }}>
                                  {item.name}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-slate-600">Weight:</span>
                                    <span className="ml-1 font-semibold">{item.weight}g</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Qty:</span>
                                    <span className="ml-1 font-semibold">{item.quantity}</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Price:</span>
                                    <span className="ml-1 font-semibold">₹{item.price}/kg</span>
                                  </div>
                                  <div>
                                    <span className="text-slate-600">Total:</span>
                                    <span className="ml-1 font-semibold text-green-600">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
                          </div>
                        )}
                        
                        {/* Payment Information */}
                        {order.paymentId && (
                          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h6 className="font-semibold text-blue-800 mb-2 flex items-center gap-2" 
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                              💳 Payment Information
                            </h6>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-blue-600 font-medium">Payment ID:</span>
                                <span className="ml-2 font-mono text-blue-800 break-all">{order.paymentId}</span>
                              </div>
                              <div>
                                <span className="text-blue-600 font-medium">Method:</span>
                                <span className="ml-2 font-semibold text-blue-800">{order.paymentMethod || 'Razorpay'}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && orderToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Delete Order
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-600 mb-3" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Are you sure you want to delete this order? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Order ID: {orderToDelete.orderId || orderToDelete.id?.slice(-8) || 'N/A'}
                </p>
                <p className="text-sm text-red-800" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Amount: ₹{orderToDelete.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0}
                </p>
                <p className="text-sm text-red-800" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Customer: {orderToDelete.cart?.[0]?.customerInfo?.name || 'N/A'}
                </p>
                <p className="text-sm text-red-800" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Status: {orderToDelete.status}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setOrderToDelete(null); }}
                className="flex-1 bg-slate-500 text-white px-4 py-2 rounded-xl hover:bg-slate-600 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteOrder}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders; 