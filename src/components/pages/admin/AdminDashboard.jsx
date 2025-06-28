import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import bgImg from '../../../assets/bg.jpg';
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
      setToast({ show: true, message: 'Error loading orders', type: 'error' });
    } finally {
      setLoading(false);
    }
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
      try {
        console.log('Fetching products...');
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Products fetched:', productsData.length);
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setToast({ show: true, message: 'Error loading products', type: 'error' });
      }
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
      setToast({ show: true, message: 'Please fill in customer details', type: 'error' });
      return;
    }

    try {
      // Store order in Firestore first
      const orderRef = await addDoc(collection(db, 'orders'), {
        cart: cart,
        user: { name: customerInfo.name, phone: customerInfo.phone, email: customerInfo.email },
        status: 'pending',
        createdAt: serverTimestamp(),
        total: total
      });

      setPendingOrderId(orderRef.id);
      setShowPaymentModal(true);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setToast({ show: true, message: 'Failed to load payment gateway', type: 'error' });
        return;
      }

      // Initialize Razorpay
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Taaza Non-Veg Market',
        description: 'Fresh Meat & Fish Purchase',
        order_id: orderRef.id,
        handler: async function (response) {
          try {
            // Update order with payment details
            await updateDoc(doc(db, 'orders', orderRef.id), {
              status: 'paid',
              paymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature
            });

            // Decrease product stock for each item in cart
            for (const item of cart) {
              const productRef = doc(db, 'products', item.id);
              const productSnap = await getDoc(productRef);
              if (productSnap.exists()) {
                const currentQty = productSnap.data().quantity || 0;
                const boughtKg = (item.weight || 0) / 1000;
                let newQty = currentQty - boughtKg;
                if (newQty < 0) newQty = 0;
                await updateDoc(productRef, { quantity: newQty });
              }
            }

            // Add transaction record
            await addDoc(collection(db, 'transactions'), {
              orderId: orderRef.id,
              paymentId: response.razorpay_payment_id,
              amount: total,
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
              items: cart,
              status: 'completed',
              createdAt: serverTimestamp()
            });

            setToast({ show: true, message: 'Payment successful! Order placed.', type: 'success' });
            setShowPaymentModal(false);
            setCart([]);
            setCustomerInfo({ name: '', phone: '', email: '' });
            fetchOrders(); // Refresh orders list

          } catch (error) {
            console.error('Error processing payment:', error);
            setToast({ show: true, message: 'Error processing payment', type: 'error' });
          }
        },
        prefill: {
          name: customerInfo.name,
          contact: customerInfo.phone,
          email: customerInfo.email
        },
        theme: {
          color: '#e74c3c'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error creating order:', error);
      setToast({ show: true, message: 'Error creating order', type: 'error' });
    }
  };

  return (
    <div className="relative main-content" style={{ backgroundImage: `url(${bgImg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Page Title */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold text-blue-700 text-center sm:text-left">
            📊 Dashboard Overview
          </h2>
          <p className="text-blue-500 responsive-text-sm sm:responsive-text-base text-center sm:text-left mt-2">
            Manage orders, products, and view analytics
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-sm">
          <h2 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-purple-700" 
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
          <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-indigo-700 drop-shadow-lg" 
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
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white scale-105 shadow-xl' 
                    : 'bg-white/95 hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 border-2 border-indigo-200 hover:border-indigo-400'
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
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-indigo-600 responsive-text-lg font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                  {loading ? '🔄 Loading products...' : '📦 No products available'}
                </div>
                {!loading && (
                  <p className="text-indigo-500 responsive-text-sm mt-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Products will appear here once added to the database.
                  </p>
                )}
              </div>
            ) : (
              getFilteredItems().map(item => (
                <div key={item.id} className="responsive-card responsive-p-6 flex flex-col items-center transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in-up bg-gradient-to-br from-white/95 to-indigo-50/30 backdrop-blur-sm border-2 border-indigo-200/50 rounded-2xl">
                  <div className="relative mb-4">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl shadow-lg border-2 border-indigo-100" 
                    />
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                      {item.category}
                    </div>
                  </div>
                  <div className="font-bold mb-2 responsive-text-lg sm:responsive-text-xl text-indigo-800 text-center leading-tight" 
                       style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {item.name}
                  </div>
                  <div className="text-indigo-600 mb-4 responsive-text-base font-semibold bg-indigo-100 px-3 py-1 rounded-full" 
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
                          className="responsive-btn border-2 border-indigo-200 rounded-lg flex-1 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all duration-200 touch-target text-center font-medium bg-white/90" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        />
                        <span className="responsive-text-base font-semibold text-indigo-700" 
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                          g
                        </span>
                      </div>
                      <div className="text-green-600 mb-3 responsive-text-base font-semibold bg-green-100 px-3 py-1 rounded-full" 
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
                        className="text-indigo-500 mt-2 responsive-text-sm hover:text-red-500 hover:underline touch-target font-medium" 
                        onClick={() => setShowWeightInput(null)}
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="responsive-btn bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 touch-target font-semibold" 
                      onClick={() => handleAddToCartClick(item)}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      🛒 Add to Cart
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {showSuccess && (
            <div className="text-green-700 mt-4 animate-fade-in responsive-text-base font-semibold text-center bg-green-100 p-3 rounded-lg border-2 border-green-300" 
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
        <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 mt-16 text-teal-700 drop-shadow-lg animate-fade-in" 
            style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800
            }}>
          📋 All Orders
        </h2>
        
        {/* Orders Table */}
        <div className="responsive-card responsive-p-6 animate-fade-in-up bg-white/95 backdrop-blur-sm border border-gray-200">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading orders...
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                📋 No orders found
              </div>
              <p className="text-gray-400 responsive-text-sm mt-2" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                {search || filterDate ? 'Try adjusting your search or filter criteria.' : 'Orders will appear here once customers place them.'}
              </p>
            </div>
          ) : (
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
          )}
        </div>
        
        {selectedOrder && <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </div>
    </div>
  );
}

export default AdminDashboard;