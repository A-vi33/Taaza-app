import React from 'react';

function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;
  
  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close modal with Escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center responsive-p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in-up">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="responsive-text-xl sm:responsive-text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              📋 Order Details
            </h2>
            <button 
              className="text-white hover:text-red-200 transition-all duration-200 touch-target responsive-text-xl font-bold p-2 hover:bg-white/20 rounded-full" 
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h3 className="font-bold text-indigo-800 mb-3 responsive-text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                📝 Order Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-indigo-700 responsive-text-sm">Order ID:</span>
                  <span className="font-mono responsive-text-xs text-indigo-600 break-all">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-indigo-700 responsive-text-sm">Date:</span>
                  <span className="responsive-text-sm text-indigo-600">{order.createdAt?.toDate?.().toLocaleString() || ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-indigo-700 responsive-text-sm">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    order.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-indigo-700 responsive-text-sm">Fulfilled:</span>
                  <span className="responsive-text-lg">{order.fulfilled ? '✅ Yes' : '❌ No'}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-800 mb-3 responsive-text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                👤 Customer Details
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-green-700 responsive-text-sm">Name:</span>
                  <span className="responsive-text-sm text-green-600">{order.user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-green-700 responsive-text-sm">Phone:</span>
                  <span className="responsive-text-sm text-green-600">{order.user?.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-green-700 responsive-text-sm">Email:</span>
                  <span className="responsive-text-sm text-green-600">{order.user?.email || 'N/A'}</span>
                </div>
                {order.paymentId && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-green-700 responsive-text-sm">Payment ID:</span>
                    <span className="font-mono responsive-text-xs text-green-600 break-all">{order.paymentId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Items */}
          <div className="bg-white border-2 border-indigo-200 rounded-lg p-4">
            <h3 className="font-bold responsive-text-lg mb-4 text-indigo-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              🛒 Order Items
            </h3>
            <div className="space-y-3">
              {order.cart?.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <div className="flex-1">
                    <div className="font-semibold text-indigo-800 responsive-text-base" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {item.name}
                    </div>
                    <div className="text-indigo-600 responsive-text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {item.weight}g × {item.quantity} = ₹{item.price * item.quantity}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600 responsive-text-base" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ₹{item.price * item.quantity}
                    </div>
                    <div className="text-indigo-500 responsive-text-xs" style={{ fontFamily: 'Inter, sans-serif' }}>
                      ₹{item.price}/kg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Total */}
          <div className="bg-gradient-to-r from-green-100 to-green-200 p-4 rounded-lg border-2 border-green-300">
            <div className="flex justify-between items-center">
              <span className="font-bold responsive-text-xl text-green-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                💰 Total Amount:
              </span>
              <span className="font-bold responsive-text-xl text-green-700" style={{ fontFamily: 'Inter, sans-serif' }}>
                ₹{order.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {order.billUrl && (
              <a 
                href={order.billUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 responsive-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 touch-target font-semibold text-center"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                📄 Download E-Bill
              </a>
            )}
            <button 
              onClick={onClose}
              className="flex-1 responsive-btn bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 touch-target font-semibold"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetailsModal; 