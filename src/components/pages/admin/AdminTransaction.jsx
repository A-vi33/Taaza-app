import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import OrderDetailsModal from '../user/OrderDetailsModal';
import bgImg from '../../../assets/bg.jpg';

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

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
    const matchesDate = filterDate ? (new Date(txn.date.seconds * 1000).toISOString().slice(0, 10) === filterDate) : true;
    return matchesName && matchesDate;
  });

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

  return (
    <div className="relative main-content" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-5xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Page Title */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold text-gray-800 text-center sm:text-left">
            💳 Transaction History
          </h2>
          <p className="text-gray-600 responsive-text-sm sm:responsive-text-base text-center sm:text-left mt-2">
            View and manage all payment transactions
          </p>
        </div>
        
        <div className="mb-6 text-center text-white/90 animate-fade-in">
          <span className="bg-blue-900/70 px-4 py-2 rounded shadow text-sm">Demo Mode: Each transaction may represent a single product purchase for testing purposes.</span>
        </div>
        <div className="flex gap-4 mb-6 animate-fade-in">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name" className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-400 transition bg-white/90 text-gray-900" />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border rounded focus:ring-2 focus:ring-blue-400 transition bg-white/90 text-gray-900" />
        </div>
        {loading ? (
          <div className="text-center py-12 animate-fade-in text-white drop-shadow-lg bg-white/10 p-6 rounded-lg" style={{textShadow:'0 2px 8px #000'}}>
            🔄 Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12 animate-fade-in text-white drop-shadow-lg bg-white/10 p-6 rounded-lg" style={{textShadow:'0 2px 8px #000'}}>
            📊 No transactions found
            <p className="text-white/70 mt-2 text-sm">
              {search || filterDate ? 'Try adjusting your search or filter criteria.' : 'Transactions will appear here once customers make purchases.'}
            </p>
          </div>
        ) : (
          <div className="bg-white/90 rounded-xl shadow-lg p-2 sm:p-6 animate-fade-in-up overflow-x-auto">
            <table className="w-full min-w-max rounded overflow-hidden text-xs sm:text-sm">
              <thead>
                <tr className="bg-blue-100">
                  <th className="p-2 whitespace-nowrap">Transaction ID</th>
                  <th className="p-2 whitespace-nowrap">Order ID</th>
                  <th className="p-2 whitespace-nowrap">User</th>
                  <th className="p-2 whitespace-nowrap">Mode</th>
                  <th className="p-2 whitespace-nowrap">Product</th>
                  <th className="p-2 whitespace-nowrap">Customer</th>
                  <th className="p-2 whitespace-nowrap">Phone</th>
                  <th className="p-2 whitespace-nowrap">Amount</th>
                  <th className="p-2 whitespace-nowrap">Status</th>
                  <th className="p-2 whitespace-nowrap">Date</th>
                  <th className="p-2 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((txn, idx) => {
                  let productName = '-';
                  if (txn.cart && Array.isArray(txn.cart) && txn.cart.length === 1) {
                    productName = txn.cart[0].name || '-';
                  } else if (txn.productName) {
                    productName = txn.productName;
                  }
                  return (
                    <tr key={txn.id} className={`border-t transition-all duration-300 ${idx % 2 === 0 ? 'bg-blue-50/50' : 'bg-white'} hover:bg-blue-200/60 animate-fade-in-up`}>
                      <td className="p-2 font-mono text-xs text-gray-900 whitespace-nowrap">{txn.transactionId}</td>
                      <td className="p-2 font-mono text-xs text-gray-900 whitespace-nowrap">{txn.orderId}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{txn.user || '-'}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{txn.mode || '-'}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{productName}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{txn.customer?.name}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{txn.customer?.phone}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">₹{txn.amount}</td>
                      <td className={`p-2 font-bold whitespace-nowrap ${txn.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>{txn.status}</td>
                      <td className="p-2 text-gray-900 whitespace-nowrap">{txn.date && (txn.date.seconds ? new Date(txn.date.seconds * 1000).toLocaleString() : new Date(txn.date).toLocaleString())}</td>
                      <td className="p-2 whitespace-nowrap">
                        <button className="text-blue-600 underline hover:text-blue-800 transition" onClick={() => handleViewOrder(txn.orderId)}>View Order</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {orderModalOpen && selectedOrder && (
          <OrderDetailsModal order={selectedOrder} onClose={() => setOrderModalOpen(false)} />
        )}
      </div>
    </div>
  );
}

export default AdminTransaction; 