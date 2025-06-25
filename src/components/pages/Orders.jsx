import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.type !== 'customer') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user?.phone) return;
      setLoading(true);
      const q = query(
        collection(db, 'orders'),
        where('user.phone', '==', user.phone),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      setOrders(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Your Orders</h1>
      {loading ? (
        <div>Loading...</div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">You have no orders yet.</p>
      ) : (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Order ID</th>
              <th className="p-2">Date</th>
              <th className="p-2">Status</th>
              <th className="p-2">Total</th>
              <th className="p-2">E-Bill</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-t">
                <td className="p-2 font-mono text-xs">{order.id}</td>
                <td className="p-2">{order.createdAt?.toDate?.().toLocaleString() || ''}</td>
                <td className="p-2">{order.status}</td>
                <td className="p-2">₹{order.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0)}</td>
                <td className="p-2">
                  {order.billUrl ? <a href={order.billUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600">Download</a> : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Orders;   