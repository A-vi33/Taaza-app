import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy } from 'firebase/firestore';
import OrderDetailsModal from './OrderDetailsModal';
 
function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
 
  useEffect(() => {
    if (!user || user.type !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);
 
  const fetchOrders = async () => {
    setLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };
 
  useEffect(() => { fetchOrders(); }, []);
 
  const handleFulfill = async (orderId, fulfilled) => {
    await updateDoc(doc(db, 'orders', orderId), { fulfilled });
    fetchOrders();
  };
 
  // Filter orders by search and date
  const filteredOrders = orders.filter(order => {
    const matchesName = order.user?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesDate = filterDate ? (order.createdAt?.toDate?.().toISOString().slice(0, 10) === filterDate) : true;
    return matchesName && matchesDate;
  });
 
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex gap-4 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by customer name" className="p-2 border rounded w-full" />
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="p-2 border rounded" />
      </div>
     
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}
 
export default AdminDashboard;