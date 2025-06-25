import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';

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

  if (loading) return <div className="p-8 text-center">Loading order...</div>;
  if (!order) return <div className="p-8 text-center text-red-600">Order not found.</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order Confirmed!</h1>
      <p className="mb-2">Thank you for your order, <span className="font-semibold">{order.user?.name}</span>!</p>
      <p className="mb-4">Order ID: <span className="font-mono">{orderId}</span></p>
      <h2 className="text-lg font-bold mb-2">Order Summary</h2>
      <ul className="mb-4">
        {order.cart?.map((item, idx) => (
          <li key={idx} className="mb-1">
            {item.name} ({item.weight}g) x {item.quantity} — ₹{item.price * item.quantity}
          </li>
        ))}
      </ul>
      <div className="mb-4">Total: <span className="font-bold">₹{order.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0)}</span></div>
      {/* E-bill download link */}
      {order.billUrl ? (
        <a href={order.billUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-semibold mb-4">Download E-Bill (PDF)</a>
      ) : (
        <div className="mb-4 text-gray-500">E-bill is being generated. Please refresh this page in a moment.</div>
      )}
    </div>
  );
}

export default OrderConfirmation; 