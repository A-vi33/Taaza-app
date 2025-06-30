import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
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

function AdminTransaction() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchTransactions = async () => {
    try {
    setLoading(true);
      console.log('Fetching transactions...');
    const q = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('Transactions fetched:', transactionsData.length);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      showToast('Error loading transactions', 'error');
    } finally {
    setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, []);

  // Filter transactions by search and date
  const filteredTransactions = transactions.filter(txn => {
    const matchesName = txn.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = filterDate ? (new Date(txn.date?.seconds * 1000).toISOString().slice(0, 10) === filterDate || new Date(txn.createdAt?.seconds * 1000).toISOString().slice(0, 10) === filterDate) : true;
    return matchesName && matchesDate;
  });

  // Calculate total revenue from all transactions
  const totalRevenue = transactions.reduce((total, txn) => {
    return total + (parseFloat(txn.amount) || 0);
  }, 0);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const handleViewOrder = async (orderId) => {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    if (orderSnap.exists()) {
      setSelectedOrder({ id: orderId, ...orderSnap.data() });
      setOrderModalOpen(true);
    } else {
      showToast('Order not found', 'error');
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      await deleteDoc(transactionRef);
      showToast('Transaction deleted successfully', 'success');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Error deleting transaction', 'error');
    }
  };

  const confirmDeleteTransaction = (transaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalOpen(true);
  };

  const executeDeleteTransaction = async () => {
    if (!transactionToDelete) return;
    
    try {
      const transactionRef = doc(db, 'transactions', transactionToDelete.id);
      await deleteDoc(transactionRef);
      showToast('Transaction deleted successfully', 'success');
      fetchTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showToast('Error deleting transaction', 'error');
    } finally {
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  };

  const handleDownloadReceipt = (transaction) => {
    // Create receipt content
    const receiptContent = `
      RECEIPT
      ========================
      Order ID: ${transaction.orderNumber || transaction.orderId}
      Date: ${transaction.date?.toDate?.()?.toLocaleDateString() || transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
      Time: ${transaction.date?.toDate?.()?.toLocaleTimeString() || transaction.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
      
      Customer Details:
      Name: ${transaction.customer?.name || 'N/A'}
      Phone: ${transaction.customer?.phone || 'N/A'}
      Email: ${transaction.customer?.email || 'N/A'}
      
      Payment Details:
      Amount: ₹${transaction.amount}
      Payment Method: ${transaction.paymentMethod || transaction.mode || 'N/A'}
      Status: ${transaction.status}
      
      Items Purchased:
      ${transaction.items?.map(item => `${item.name} - ${item.weight}g x${item.quantity} - ₹${item.price * item.quantity}`).join('\n') || 'N/A'}
      
      ========================
      Thank you for your purchase!
    `;
    
    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${transaction.orderNumber || transaction.orderId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Receipt downloaded successfully', 'success');
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-6xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Enhanced Page Header */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    💰
                  </div>
                  Transaction Management
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Monitor and manage all financial transactions and payment records
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  💳 {transactions.length} Transactions
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  ₹{totalRevenue.toFixed(2)} Total
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8 animate-fade-in">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.5px' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔍
        </div>
            Filter Transactions
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search by order ID or customer name..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="responsive-btn border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all duration-200 bg-white text-black font-semibold shadow-sm placeholder-gray-500" 
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', letterSpacing: '0.2px' }}
            />
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="responsive-btn border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-600 focus:border-slate-600 transition-all duration-200 bg-white text-black font-semibold shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif', fontSize: '1rem', letterSpacing: '0.2px' }}
            />
          </div>
        </div>
        
        {/* Transactions List */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              📋
            </div>
            Transaction History
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading transactions...
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                📭 No transactions found
              </div>
              <p className="text-slate-500 responsive-text-sm mt-2" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                {search || filterDate ? 'Try adjusting your filters.' : 'Transactions will appear here once orders are placed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.map(transaction => (
                <div key={transaction.id} className="group relative bg-yellow-100 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden p-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-900 responsive-text-lg" 
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Order #{transaction.orderNumber || transaction.orderId?.slice(-8) || 'N/A'}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          transaction.status === 'success' || transaction.status === 'paid'
                            ? 'bg-green-100 text-green-800' 
                            : transaction.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`} 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                          {transaction.status === 'success' || transaction.status === 'paid' ? '✅ Paid' : transaction.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Amount:
                          </p>
                          <p className="font-bold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            ₹{transaction.amount}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Payment Method:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {transaction.paymentMethod || 'Razorpay'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Date:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {transaction.date?.toDate?.()?.toLocaleDateString() || transaction.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Time:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {transaction.date?.toDate?.()?.toLocaleTimeString() || transaction.createdAt?.toDate?.()?.toLocaleTimeString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      {transaction.customer && (
                        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200">
                          <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Customer Details:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {transaction.customer.name} ({transaction.customer.phone})
                            {transaction.customer.email && ` | ${transaction.customer.email}`}
                          </p>
                        </div>
                      )}
                      
                      {transaction.items && transaction.items.length > 0 && (
                        <div className="mt-3">
                          <p className="text-slate-600 font-medium mb-2" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Items Purchased:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {transaction.items.map((item, index) => (
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
                        onClick={() => handleViewOrder(transaction.orderId)} 
                        className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 transition shadow-sm font-semibold" 
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        View Details
                      </button>
                      {(transaction.status === 'success' || transaction.status === 'paid') && (
                        <button 
                          onClick={() => handleDownloadReceipt(transaction)} 
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition shadow-sm font-semibold" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Download Receipt
                        </button>
                      )}
                      <button
                        onClick={() => confirmDeleteTransaction(transaction)}
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition shadow-sm font-semibold"
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-800" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Transaction Details
              </h3>
              <button 
                onClick={() => { setOrderModalOpen(false); setSelectedOrder(null); }} 
                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-600 font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Order ID:
                  </p>
                  <p className="font-bold text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedOrder.orderId || selectedOrder.orderNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Status:
                  </p>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    selectedOrder.status === 'success' || selectedOrder.status === 'paid'
                      ? 'bg-green-100 text-green-800' 
                      : selectedOrder.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                  }`} 
                  style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-slate-600 font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Amount:
                  </p>
                  <p className="font-bold text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    ₹{selectedOrder.amount || (selectedOrder.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Payment Method:
                  </p>
                  <p className="font-semibold text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    {selectedOrder.paymentMethod || 'Razorpay'}
                  </p>
                </div>
              </div>
              
              {selectedOrder.user && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Customer Information
                  </h4>
                  <div className="space-y-2">
                    <p className="text-slate-600" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>Name:</strong> {selectedOrder.user.name || 'N/A'}
                    </p>
                    <p className="text-slate-600" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>Phone:</strong> {selectedOrder.user.phone || 'N/A'}
                    </p>
                    {selectedOrder.user.email && (
                      <p className="text-slate-600" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                        <strong>Email:</strong> {selectedOrder.user.email}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {selectedOrder.cart && selectedOrder.cart.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-2" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Items Purchased
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.cart.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.name}
                          </p>
                          <p className="text-slate-600 text-sm" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Weight: {item.weight}g | Quantity: {item.quantity}
                          </p>
                        </div>
                        <p className="font-bold text-slate-900" 
                           style={{ fontFamily: 'Inter, sans-serif' }}>
                          ₹{item.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setOrderModalOpen(false); setSelectedOrder(null); }}
                className="flex-1 bg-slate-500 text-white px-4 py-2 rounded-xl hover:bg-slate-600 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Close
              </button>
              {(selectedOrder.status === 'success' || selectedOrder.status === 'paid') && (
                <button
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition font-semibold"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Download Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && transactionToDelete && (
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
                Delete Transaction
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-slate-600 mb-3" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Are you sure you want to delete this transaction? This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Order ID: {transactionToDelete.orderNumber || transactionToDelete.orderId?.slice(-8) || 'N/A'}
                </p>
                <p className="text-sm text-red-800" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Amount: ₹{transactionToDelete.amount}
                </p>
                <p className="text-sm text-red-800" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Customer: {transactionToDelete.customer?.name || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleteModalOpen(false); setTransactionToDelete(null); }}
                className="flex-1 bg-slate-500 text-white px-4 py-2 rounded-xl hover:bg-slate-600 transition font-semibold"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteTransaction}
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

export default AdminTransaction; 