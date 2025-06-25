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
      {loading ? <div>Loading orders...</div> : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Order ID</th>
              <th className="p-2">Customer</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Fulfilled</th>
              <th className="p-2">E-Bill</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id} className="border-t">
                <td className="p-2 font-mono text-xs">{order.id}</td>
                <td className="p-2">{order.user?.name}</td>
                <td className="p-2">{order.user?.phone}</td>
                <td className="p-2">{order.createdAt?.toDate?.().toLocaleString() || ''}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">{order.fulfilled ? '✅' : '❌'}</td>
                <td className="p-2">
                  {order.billUrl ? <a href={order.billUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">Download</a> : '—'}
                </td>
                <td className="p-2">
                  <button className="text-green-600 mr-2" onClick={() => handleFulfill(order.id, true)}>Mark Fulfilled</button>
                  <button className="text-yellow-600 mr-2" onClick={() => handleFulfill(order.id, false)}>Mark Pending</button>
                  <button className="text-blue-600" onClick={() => setSelectedOrder(order)}>View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

export default AdminDashboard; 