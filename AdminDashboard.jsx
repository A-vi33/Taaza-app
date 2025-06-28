import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, getDocs, updateDoc, doc, query, orderBy, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import OrderDetailsModal from './OrderDetailsModal';
import bgImg from '../../assets/bg.jpg';
 
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
 
function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [weightInput, setWeightInput] = useState({});
  const [showWeightInput, setShowWeightInput] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
 
  // Add Razorpay payment integration
  const RAZORPAY_KEY_ID = 'rzp_test_Ty2fPZgb35aMIa';
 
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
 
  // Fetch products for admin to purchase
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchProducts();
  }, []);
 
  // Product filtering logic
  const groupedItems = {
    chicken: products.filter(item => item.category === 'chicken'),
    fish: products.filter(item => item.category === 'fish'),
    mutton: products.filter(item => item.category === 'mutton'),
    goat: products.filter(item => item.category === 'goat'),
    duck: products.filter(item => item.category === 'duck'),
    quail: products.filter(item => item.category === 'quail')
  };
  const getFilteredItems = () => {
    if (activeFilter === 'all') {
      return products;
    }
    return groupedItems[activeFilter] || [];
  };
  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
  };
  const calculatePrice = (item, weight) => {
    return Math.round((item.price * (weight / 1000)));
  };
  const handleAddToCartClick = (item) => {
    setShowWeightInput(item.id);
    setWeightInput((prev) => ({ ...prev, [item.id]: 500 }));
  };
  const handleWeightChange = (itemId, value) => {
    let val = parseInt(value, 10);
    if (isNaN(val) || val < 50) val = 50;
    if (val > 20000) val = 20000;
    setWeightInput((prev) => ({ ...prev, [itemId]: val }));
  };
  const handleConfirmAddToCart = (item) => {
    const weight = weightInput[item.id] || 500;
    const price = calculatePrice(item, weight);
    const cartItem = {
      ...item,
      weight,
      price,
      quantity: 1
    };
    // For this flow, replace cart with just this item
    setCart([cartItem]);
    setSuccessMessage(`${item.name} (${weight}g) added to cart successfully!`);
    setShowSuccess(true);
    setShowWeightInput(null);
    setTimeout(() => {
      setShowSuccess(false);
    }, 1000);
    // Immediately trigger checkout/payment
    setShowCart(false);
    setShowCheckout(false);
    setTimeout(() => {
      handleCheckout();
    }, 1200); // Wait for success message to show
  };
  const updateQuantity = (id, weight, quantity) => {
    const updated = cart.map(item =>
      item.id === id && item.weight === weight ? { ...item, quantity } : item
    ).filter(item => item.quantity > 0);
    setCart(updated);
  };
  const removeItem = (id, weight) => {
    const updated = cart.filter(item => !(item.id === id && item.weight === weight));
    setCart(updated);
  };
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
 
  // Checkout logic
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      alert('Please enter customer name and phone.');
      return;
    }
    try {
      const userObj = { name: customerInfo.name, phone: customerInfo.phone };
      if (customerInfo.email) userObj.email = customerInfo.email;
      const orderRef = await addDoc(collection(db, 'orders'), {
        cart,
        user: userObj,
        paymentId: '',
        status: 'pending',
        createdAt: serverTimestamp(),
        fulfilled: false
      });
      setPendingOrderId(orderRef.id);
      // Start Razorpay payment
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load.');
        return;
      }
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // in paise
        currency: 'INR',
        name: 'Taaza Chicken',
        description: 'Order Payment',
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id;
          await addDoc(collection(db, 'transactions'), {
            orderId: orderRef.id,
            transactionId: paymentId,
            amount: total,
            status: 'success',
            date: new Date(),
            customer: { ...customerInfo },
            mode: 'Razorpay',
            user: user?.name || user?.email || 'Admin'
          });
          await updateDoc(doc(db, 'orders', orderRef.id), {
            paymentId,
            status: 'paid'
          });
          // Generate e-bill HTML and upload as before
          const billHtml = `
            <div style='font-family:sans-serif;padding:24px;'>
              <h2 style='color:#27ae60;'>Tazza Chicken - E-Bill</h2>
              <p><strong>Name:</strong> ${customerInfo.name}</p>
              <p><strong>Phone:</strong> ${customerInfo.phone}</p>
              ${customerInfo.email ? `<p><strong>Email:</strong> ${customerInfo.email}</p>` : ''}
              <p><strong>Order ID:</strong> ${orderRef.id}</p>
              <p><strong>Transaction ID:</strong> ${paymentId}</p>
              <table border='1' cellpadding='8' cellspacing='0' style='margin-top:16px;width:100%;'>
                <thead><tr><th>Item</th><th>Weight</th><th>Qty</th><th>Price</th></tr></thead>
                <tbody>
                  ${cart.map(item => `<tr><td>${item.name}</td><td>${item.weight}g</td><td>${item.quantity}</td><td>₹${item.price * item.quantity}</td></tr>`).join('')}
                </tbody>
              </table>
              <p style='margin-top:16px;'><strong>Total:</strong> ₹${total}</p>
              <p style='margin-top:8px;'>Thank you for ordering from Tazza Chicken!</p>
            </div>
          `;
          const billRef = ref(storage, `bills/${orderRef.id}.pdf`);
          const pdfBlob = await new Promise((resolve, reject) => {
            const iframe = document.createElement('iframe');
            document.body.appendChild(iframe);
            const docu = iframe.contentWindow.document;
            docu.open();
            docu.write(billHtml);
            docu.close();
            iframe.onload = () => {
              window.html2pdf()
                .from(iframe.contentWindow.document.body)
                .outputPdf('blob')
                .then(blob => {
                  document.body.removeChild(iframe);
                  resolve(blob);
                })
                .catch(err => {
                  document.body.removeChild(iframe);
                  reject(err);
                });
            };
          });
          await uploadBytes(billRef, pdfBlob, { contentType: 'application/pdf' });
          const billUrl = await getDownloadURL(billRef);
          await updateDoc(doc(db, 'orders', orderRef.id), { billUrl });
          // Decrease product stock for each item in cart
          for (const item of cart) {
            const productRef = doc(db, 'products', item.id);
            // Get current product
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              const currentQty = productSnap.data().quantity || 0;
              // item.weight is in grams, convert to kg
              const boughtKg = (item.weight || 0) / 1000;
              let newQty = currentQty - boughtKg;
              if (newQty < 0) newQty = 0;
              await updateDoc(productRef, { quantity: newQty });
            }
          }
          setCart([]);
          setShowCart(false);
          setShowCheckout(false);
          setCustomerInfo({ name: '', phone: '', email: '' });
          setPendingOrderId(null);
          showToast('Payment successful! Order placed and e-bill generated.', 'success');
        },
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email || '',
          contact: customerInfo.phone
        },
        theme: {
          color: '#27ae60'
        },
        modal: {
          ondismiss: function () {
            showToast('Payment cancelled. Order is still pending.', 'error');
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Order saving or payment failed! ' + (err.message || err));
    }
  };
 
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };
 
  return (
    <div className="relative min-h-screen" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Main Title */}
        <h1 className="responsive-text-3xl sm:responsive-text-4xl lg:responsive-text-5xl font-extrabold mb-8 text-center text-white drop-shadow-lg tracking-tight animate-fade-in" 
            style={{
              textShadow: '0 4px 12px rgba(0,0,0,0.8)',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.025em'
            }}>
          🏪 Admin Dashboard
        </h1>
        
        {/* Search and Filter Section */}
        <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-sm">
          <h2 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-gray-800" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            🔍 Search & Filter Orders
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by customer name..." 
              className="responsive-btn border-2 border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-white/90 text-gray-900 font-medium" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="responsive-btn border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 bg-white/90 text-gray-900 font-medium" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>
       
        {/* Product Browsing Section */}
        <div className="mb-12 animate-fade-in-up">
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-white drop-shadow-lg" 
              style={{
                textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 800
              }}>
            🛒 Purchase Products
          </h2>
          
          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            {['all', 'chicken', 'fish', 'mutton', 'goat', 'duck', 'quail'].map(cat => (
              <button 
                key={cat} 
                className={`responsive-btn rounded-full transition-all duration-300 shadow-lg touch-target font-semibold ${
                  activeFilter === cat 
                    ? 'bg-gradient-to-r from-green-600 to-green-700 text-white scale-105 shadow-xl' 
                    : 'bg-white/90 hover:bg-green-50 text-gray-700 hover:text-green-700 border-2 border-gray-200 hover:border-green-300'
                }`} 
                onClick={() => handleFilterClick(cat)}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Products Grid */}
          <div className="responsive-grid-1 sm:responsive-grid-2 lg:responsive-grid-3 gap-6">
            {getFilteredItems().map(item => (
              <div key={item.id} className="responsive-card responsive-p-6 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up bg-white/95 backdrop-blur-sm border border-gray-200">
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  className="w-20 h-20 sm:w-24 sm:h-24 object-cover mb-4 rounded-xl shadow-lg" 
                />
                <div className="font-bold mb-2 responsive-text-lg sm:responsive-text-xl text-gray-900 text-center" 
                     style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {item.name}
                </div>
                <div className="text-gray-700 mb-4 responsive-text-base font-semibold" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                  ₹{item.price}/kg
                </div>
                {showWeightInput === item.id ? (
                  <div className="flex flex-col items-center mb-4 animate-fade-in w-full">
                    <div className="flex items-center gap-2 mb-3 w-full">
                      <input 
                        type="number" 
                        min="50" 
                        max="20000" 
                        step="50" 
                        value={weightInput[item.id] || 500} 
                        onChange={e => handleWeightChange(item.id, e.target.value)} 
                        className="responsive-btn border-2 border-gray-200 rounded-lg flex-1 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 touch-target text-center font-medium" 
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      />
                      <span className="responsive-text-base font-semibold text-gray-700" 
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                        g
                      </span>
                    </div>
                    <div className="text-green-600 mb-3 responsive-text-base font-semibold" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                      Price: ₹{calculatePrice(item, weightInput[item.id] || 500)}
                    </div>
                    <button 
                      className="responsive-btn bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 touch-target font-semibold" 
                      onClick={() => handleConfirmAddToCart(item)}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      ✅ Add to Cart
                    </button>
                    <button 
                      className="text-gray-500 mt-2 responsive-text-sm hover:text-red-500 hover:underline touch-target font-medium" 
                      onClick={() => setShowWeightInput(null)}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    className="responsive-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 touch-target font-semibold" 
                    onClick={() => handleAddToCartClick(item)}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    🛒 Add to Cart
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {showSuccess && (
            <div className="text-green-600 mt-4 animate-fade-in responsive-text-base font-semibold text-center bg-green-50 p-3 rounded-lg border border-green-200" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
              ✅ {successMessage}
            </div>
          )}
          
          <button 
            className="mt-8 responsive-btn bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg shadow-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 touch-target font-bold" 
            onClick={() => setShowCart(true)} 
            disabled={cart.length === 0}
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            🛒 View Cart ({cart.length} items)
          </button>
        </div>
        
        {/* Cart Modal */}
        {showCart && (
          <div className="responsive-modal">
            <div className="responsive-modal-content max-w-2xl">
              <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-all duration-200 touch-target responsive-text-xl font-bold" 
                onClick={() => setShowCart(false)}
              >
                ✕
              </button>
              <h2 className="responsive-text-2xl font-bold mb-6 text-green-700" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                🛒 Shopping Cart
              </h2>
              {cart.length === 0 ? (
                <p className="text-gray-500 responsive-text-lg text-center font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Your cart is empty.
                </p>
              ) : (
                <div>
                  <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                    {cart.map(item => (
                      <div key={item.id + '-' + item.weight} className="flex items-center justify-between responsive-p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <div className="font-semibold responsive-text-base text-gray-900" 
                               style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {item.name}
                          </div>
                          <div className="text-gray-600 responsive-text-sm font-medium" 
                               style={{ fontFamily: 'Inter, sans-serif' }}>
                            {item.weight}g × {item.quantity}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold responsive-text-base text-green-600" 
                                style={{ fontFamily: 'Inter, sans-serif' }}>
                            ₹{item.price * item.quantity}
                          </span>
                          <button 
                            className="responsive-btn bg-red-500 text-white rounded-lg shadow hover:bg-red-600 transition-all duration-200 touch-target font-semibold" 
                            onClick={() => removeItem(item.id, item.weight)}
                            style={{ fontFamily: 'Inter, sans-serif' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <span className="responsive-text-xl font-bold text-gray-900" 
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      Total:
                    </span>
                    <span className="responsive-text-xl font-bold text-green-600" 
                          style={{ fontFamily: 'Inter, sans-serif' }}>
                      ₹{total}
                    </span>
                  </div>
                  <button 
                    className="w-full responsive-btn bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 touch-target font-bold" 
                    onClick={() => { setShowCart(false); setShowCheckout(true); }}
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    💳 Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Checkout Modal */}
        {showCheckout && (
          <div className="responsive-modal">
            <div className="responsive-modal-content max-w-2xl">
              <button 
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 transition-all duration-200 touch-target responsive-text-xl font-bold" 
                onClick={() => setShowCheckout(false)}
              >
                ✕
              </button>
              <h2 className="responsive-text-2xl font-bold mb-6 text-green-700" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                💳 Checkout
              </h2>
              <div className="mb-6 space-y-4">
                <input 
                  type="text" 
                  placeholder="Customer Name" 
                  className="responsive-btn border-2 border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 touch-target font-medium" 
                  value={customerInfo.name} 
                  onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })} 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <input 
                  type="tel" 
                  placeholder="Customer Phone" 
                  className="responsive-btn border-2 border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 touch-target font-medium" 
                  value={customerInfo.phone} 
                  onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })} 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
                <input 
                  type="email" 
                  placeholder="Customer Email (optional)" 
                  className="responsive-btn border-2 border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all duration-200 touch-target font-medium" 
                  value={customerInfo.email} 
                  onChange={e => setCustomerInfo({ ...customerInfo, email: e.target.value })} 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <div className="flex justify-between items-center mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <span className="responsive-text-xl font-bold text-gray-900" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  Total:
                </span>
                <span className="responsive-text-xl font-bold text-blue-600" 
                      style={{ fontFamily: 'Inter, sans-serif' }}>
                  ₹{total}
                </span>
              </div>
              <button 
                className="w-full responsive-btn bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 touch-target font-bold" 
                onClick={handleCheckout}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                🚀 Place Order
              </button>
            </div>
          </div>
        )}
        
        {/* Existing Orders Section */}
        <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 mt-16 text-white drop-shadow-lg animate-fade-in" 
            style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800
            }}>
          📋 All Orders
        </h2>
        
        {/* Orders Table */}
        <div className="responsive-card responsive-p-6 animate-fade-in-up bg-white/95 backdrop-blur-sm border border-gray-200">
          <div className="responsive-table">
            <table className="w-full rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                  <th className="responsive-p-3 responsive-text-sm font-bold text-gray-800" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Customer
                  </th>
                  <th className="responsive-p-3 responsive-text-sm font-bold text-gray-800 mobile-hidden" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Date
                  </th>
                  <th className="responsive-p-3 responsive-text-sm font-bold text-gray-800" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Status
                  </th>
                  <th className="responsive-p-3 responsive-text-sm font-bold text-gray-800 mobile-hidden" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Total
                  </th>
                  <th className="responsive-p-3 responsive-text-sm font-bold text-gray-800" 
                      style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                    <td className="responsive-p-3 responsive-text-sm">
                      <div>
                        <div className="font-semibold text-gray-900" 
                             style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          {order.user?.name}
                        </div>
                        <div className="text-gray-500 mobile-hidden font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                          {order.user?.phone}
                        </div>
                      </div>
                    </td>
                    <td className="responsive-p-3 responsive-text-sm mobile-hidden text-gray-700 font-medium" 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                      {order.createdAt?.toDate?.().toLocaleDateString()}
                    </td>
                    <td className="responsive-p-3 responsive-text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        order.status === 'paid' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`} 
                      style={{ fontFamily: 'Inter, sans-serif' }}>
                        {order.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="responsive-p-3 responsive-text-sm mobile-hidden text-gray-700 font-semibold" 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                      ₹{order.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                    </td>
                    <td className="responsive-p-3 responsive-text-sm">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button 
                          className="responsive-btn bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:from-blue-700 hover:to-blue-800 transition-all duration-200 touch-target font-semibold" 
                          onClick={() => setSelectedOrder(order)}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          👁️ View
                        </button>
                        <button 
                          className={`responsive-btn rounded-lg shadow transition-all duration-200 touch-target font-semibold ${
                            order.fulfilled 
                              ? 'bg-gray-500 text-white' 
                              : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800'
                          }`} 
                          onClick={() => handleFulfill(order.id, !order.fulfilled)}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {order.fulfilled ? '✅ Fulfilled' : '📦 Mark Fulfilled'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </div>
    </div>
  );
}

export default AdminDashboard;