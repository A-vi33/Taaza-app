import React from 'react';

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg relative">
        <button className="absolute top-2 right-2 text-gray-500" onClick={onClose}>✕</button>
        <h2 className="text-xl font-bold mb-2">Order Details</h2>
        <div className="mb-2"><b>Order ID:</b> <span className="font-mono">{order.id}</span></div>
        <div className="mb-2"><b>Customer:</b> {order.user?.name} ({order.user?.phone})</div>
        <div className="mb-2"><b>Date:</b> {order.createdAt?.toDate?.().toLocaleString() || ''}</div>
        <div className="mb-2"><b>Status:</b> {order.status}</div>
        <div className="mb-2"><b>Fulfilled:</b> {order.fulfilled ? '✅' : '❌'}</div>
        <div className="mb-2"><b>Payment ID:</b> {order.paymentId}</div>
        <h3 className="font-bold mt-4 mb-2">Items</h3>
        <ul className="mb-2">
          {order.cart?.map((item, idx) => (
            <li key={idx} className="text-sm mb-1">
              {item.name} ({item.weight}g) x {item.quantity} — ₹{item.price * item.quantity}
            </li>
          ))}
        </ul>
        <div className="mb-2"><b>Total:</b> ₹{order.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0)}</div>
        {order.billUrl && (
          <div className="mb-2">
            <a href={order.billUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download E-Bill (PDF)</a>
          </div>
        )}
        {/* TODO: Payment proof if available */}
      </div>
    </div>
  );
}

export default OrderDetailsModal; 