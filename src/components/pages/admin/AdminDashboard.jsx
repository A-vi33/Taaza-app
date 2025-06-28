import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
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
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemWeight, setItemWeight] = useState(500);

  // Add Razorpay payment integration
  const RAZORPAY_KEY_ID = 'rzp_test_Ty2fPZgb35aMIa';

  useEffect(() => {
    if (!user || !user.isAdmin) {
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
    setSelectedItem(item);
    setItemWeight(500);
    setShowCustomerForm(true);
  };
  const handleWeightChange = (itemId, value) => {
    setItemWeight(parseInt(value) || 0);
  };
  const handleConfirmAddToCart = (item) => {
    if (!customerInfo.name || !customerInfo.phone) {
      setToast({ show: true, message: 'Name and phone number are required', type: 'error' });
      return;
    }

    const price = calculatePrice(item, itemWeight);
    const newItem = {
      ...item,
      weight: itemWeight,
      price: parseFloat(price),
      quantity: 1,
      customerInfo: { ...customerInfo }
    };

    setCart(prev => [...prev, newItem]);
    setShowCustomerForm(false);
    setSelectedItem(null);
    setCustomerInfo({ name: '', phone: '', email: '' });
    setToast({ show: true, message: 'Item added to cart', type: 'success' });
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

  const sendSMS = async (phone, message) => {
    // For now, we'll just log the SMS. In production, integrate with SMS service like Twilio
    console.log(`SMS to ${phone}: ${message}`);
    // You can integrate with Twilio, AWS SNS, or any SMS service here
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setToast({ show: true, message: 'Cart is empty', type: 'error' });
      return;
    }

    // Check if all items have customer info
    const itemsWithoutCustomerInfo = cart.filter(item => !item.customerInfo || !item.customerInfo.name || !item.customerInfo.phone);
    if (itemsWithoutCustomerInfo.length > 0) {
      setToast({ show: true, message: 'All items must have customer details', type: 'error' });
      return;
    }

    try {
      // Calculate total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setToast({ show: true, message: 'Failed to load payment gateway', type: 'error' });
        return;
      }

      // Create a unique order ID for Razorpay (since we can't deploy backend)
      const razorpayOrderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Store order in Firestore first
      const orderRef = await addDoc(collection(db, 'orders'), {
        cart: cart,
        status: 'pending',
        createdAt: serverTimestamp(),
        total: total,
        razorpayOrderId: razorpayOrderId
      });

      setPendingOrderId(orderRef.id);
      setShowPaymentModal(true);

      // Initialize Razorpay with the proper order ID
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: total * 100, // Razorpay expects amount in paise
        currency: 'INR',
        name: 'Taaza Non-Veg Market',
        description: 'Fresh Meat & Fish Purchase',
        order_id: razorpayOrderId, // Use the generated Razorpay order ID
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
              items: cart,
              status: 'completed',
              createdAt: serverTimestamp()
            });

            // Send SMS receipts to all customers
            for (const item of cart) {
              if (item.customerInfo && item.customerInfo.phone) {
                const smsMessage = `Thank you for your order! Order ID: ${orderRef.id}, Amount: ₹${item.price * item.quantity}, Items: ${item.name} (${item.weight}g). Payment ID: ${response.razorpay_payment_id}`;
                await sendSMS(item.customerInfo.phone, smsMessage);
              }
            }

            setToast({ show: true, message: 'Payment successful! Order placed and SMS sent.', type: 'success' });
            setShowPaymentModal(false);
            setCart([]);
            fetchOrders(); // Refresh orders list
            fetchProducts(); // Refresh products list to show updated stock

          } catch (error) {
            console.error('Error processing payment:', error);
            setToast({ show: true, message: 'Error processing payment', type: 'error' });
          }
        },
        prefill: {
          name: cart[0]?.customerInfo?.name || '',
          contact: cart[0]?.customerInfo?.phone || '',
          email: cart[0]?.customerInfo?.email || ''
        },
        theme: {
          color: '#e74c3c'
        },
        modal: {
          ondismiss: function () {
            setToast({ show: true, message: 'Payment cancelled. Order is still pending.', type: 'warning' });
            setShowPaymentModal(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Error creating order:', error);
      setToast({ show: true, message: 'Error creating order: ' + error.message, type: 'error' });
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-white">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-7xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Enhanced Page Header */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    📊
                  </div>
                  Dashboard Overview
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Manage orders, products, and view analytics with real-time insights
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  🟢 System Online
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📊 Live Data
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Search and Filter Section */}
        <div className="responsive-card responsive-p-6 mb-8 animate-fade-in bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
          <h2 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔍
            </div>
            Search & Filter Orders
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search by customer name..." 
              className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>
        </div>
       
        {/* Product Browsing Section */}
        <div className="mb-12 animate-fade-in-up">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
            <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-slate-800 flex items-center gap-3" 
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800
                }}>
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                🛒
              </div>
              Purchase Products
            </h2>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['all', 'chicken', 'fish', 'mutton', 'goat', 'duck', 'quail'].map(cat => (
                <button 
                  key={cat} 
                  className={`responsive-btn rounded-full transition-all duration-300 shadow-lg touch-target font-semibold ${
                    activeFilter === cat 
                      ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white scale-105 shadow-xl' 
                      : 'bg-white/95 hover:bg-slate-50 text-slate-700 hover:text-slate-800 border-2 border-slate-200 hover:border-slate-400'
                  }`} 
                  onClick={() => handleFilterClick(cat)}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/20">
                <div className="text-slate-600 responsive-text-lg font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                  {loading ? '🔄 Loading products...' : '📦 No products available'}
                </div>
                {!loading && (
                  <p className="text-slate-500 responsive-text-sm mt-2" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Products will appear here once added to the database.
                  </p>
                )}
              </div>
            ) : (
              getFilteredItems().map(item => (
                <div key={item.id} className="group relative bg-white/95 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                  {/* Product Image Container */}
                  <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 p-4">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-110" 
                    />
                    {/* Category Badge */}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </div>
                    {/* Stock Status Badge */}
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                      (item.quantity || 0) > 10 ? 'bg-green-100 text-green-800' : 
                      (item.quantity || 0) > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                    </div>
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-6">
                    {/* Product Name */}
                    <h3 className="font-bold mb-3 text-lg text-slate-800 leading-tight group-hover:text-slate-900 transition-colors" 
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {item.name}
                    </h3>
                    
                    {/* Price and Stock Info */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-slate-700" 
                              style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          ₹{item.price}
                        </span>
                        <span className="text-sm text-slate-500 font-medium" 
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                          per kg
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 font-medium" 
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                          📦 Available:
                        </span>
                        <span className={`text-sm font-bold ${
                          (item.quantity || 0) > 10 ? 'text-green-600' : 
                          (item.quantity || 0) > 0 ? 'text-yellow-600' : 
                          'text-red-600'
                        }`} 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.quantity || 0} kg
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button 
                      onClick={() => handleAddToCartClick(item)}
                      disabled={(item.quantity || 0) <= 0}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg ${
                        (item.quantity || 0) > 0 
                          ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800' 
                          : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      }`}
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {(item.quantity || 0) > 0 ? '🛒 Add to Cart' : '❌ Out of Stock'}
                    </button>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cart Section */}
        {cart.length > 0 && (
          <div className="mb-8 animate-fade-in-up">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
              <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-slate-800 flex items-center gap-3" 
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 800
                  }}>
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                  🛒
                </div>
                Shopping Cart
              </h2>
            </div>
            <div className="responsive-card responsive-p-6 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-lg shadow-sm flex-shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="responsive-text-lg font-bold text-slate-900 mb-1" 
                          style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        {item.name}
                      </h3>
                      <p className="responsive-text-sm text-slate-600 mb-2" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                        Weight: {item.weight}g | Price: ₹{item.price}
                      </p>
                      <p className="responsive-text-sm text-slate-700 mb-2" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                        Customer: {item.customerInfo?.name} ({item.customerInfo?.phone})
                        {item.customerInfo?.email && ` | ${item.customerInfo.email}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <button 
                          className="responsive-btn bg-slate-200 hover:bg-slate-300 transition touch-target rounded-lg px-2 py-1" 
                          onClick={() => updateQuantity(item.id, item.weight, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="responsive-text-base font-medium mx-2 min-w-[2rem] text-center" 
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                          {item.quantity}
                        </span>
                        <button 
                          className="responsive-btn bg-slate-200 hover:bg-slate-300 transition touch-target rounded-lg px-2 py-1" 
                          onClick={() => updateQuantity(item.id, item.weight, item.quantity + 1)}
                        >
                          +
                        </button>
                        <span className="responsive-text-base font-semibold text-slate-700 ml-4" 
                              style={{ fontFamily: 'Inter, sans-serif' }}>
                          ₹{item.price * item.quantity}
                        </span>
                        <button 
                          className="responsive-btn bg-red-600 text-white hover:bg-red-700 transition ml-2 sm:ml-4 touch-target rounded-lg px-3 py-1" 
                          onClick={() => removeItem(item.id, item.weight)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                  <span className="responsive-text-xl font-bold text-slate-900" 
                        style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Total: ₹{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                  </span>
                  <button 
                    onClick={handleCheckout}
                    className="responsive-btn bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl transition-all duration-300 hover:from-slate-700 hover:to-slate-800 transform hover:scale-105 shadow-lg touch-target" 
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Section */}
        <div className="animate-fade-in-up">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-6">
            <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold mb-6 text-slate-800 flex items-center gap-3" 
                style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800
                }}>
              <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                📋
              </div>
              Recent Orders
            </h2>
          </div>
          <div className="responsive-card responsive-p-6 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-600 responsive-text-lg font-medium" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                  📭 No orders yet
                </div>
                <p className="text-slate-500 responsive-text-sm mt-2" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Orders will appear here once customers make purchases.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="responsive-text-lg font-bold text-slate-900 mb-2" 
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="responsive-text-sm text-slate-600 mb-1" 
                           style={{ fontFamily: 'Inter, sans-serif' }}>
                          Status: <span className={`font-semibold ${order.status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {order.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                          </span>
                        </p>
                        <p className="responsive-text-sm text-slate-600 mb-1" 
                           style={{ fontFamily: 'Inter, sans-serif' }}>
                          Total: ₹{order.cart?.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </p>
                        <p className="responsive-text-sm text-slate-600" 
                           style={{ fontFamily: 'Inter, sans-serif' }}>
                          Date: {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                        </p>
                        {order.cart && order.cart.length > 0 && (
                          <div className="mt-2">
                            <p className="responsive-text-sm text-slate-600 mb-1" 
                               style={{ fontFamily: 'Inter, sans-serif' }}>
                              Items: {order.cart.map(item => `${item.name} (${item.weight}g)`).join(', ')}
                            </p>
                            {order.cart[0]?.customerInfo && (
                              <p className="responsive-text-sm text-slate-700" 
                                 style={{ fontFamily: 'Inter, sans-serif' }}>
                                Customer: {order.cart[0].customerInfo.name} ({order.cart[0].customerInfo.phone})
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleFulfill(order.id, !order.fulfilled)}
                          className={`responsive-btn font-semibold rounded-xl transition-all duration-300 touch-target ${
                            order.fulfilled 
                              ? 'bg-slate-500 hover:bg-slate-600 text-white' 
                              : 'bg-slate-600 hover:bg-slate-700 text-white'
                          }`}
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          {order.fulfilled ? 'Mark Unfulfilled' : 'Mark Fulfilled'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerForm && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
            <h3 className="responsive-text-xl font-bold mb-4 text-slate-800" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Customer Details for {selectedItem.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  className="w-full responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                  placeholder="Enter email (optional)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Weight (g)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={itemWeight}
                    onChange={(e) => handleWeightChange(selectedItem.id, e.target.value)}
                    className="flex-1 responsive-btn border-2 border-slate-200 rounded-l-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200"
                    placeholder="500"
                    min="100"
                    step="100"
                  />
                  <span className="bg-slate-100 px-3 py-2 border-2 border-l-0 border-slate-200 rounded-r-xl text-slate-600" 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                    g
                  </span>
                </div>
                <p className="text-sm text-slate-500 mt-1" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Price: ₹{calculatePrice(selectedItem, itemWeight)}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomerForm(false);
                  setSelectedItem(null);
                  setCustomerInfo({ name: '', phone: '', email: '' });
                }}
                className="flex-1 responsive-btn bg-slate-500 text-white hover:bg-slate-600 transition rounded-xl"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAddToCart(selectedItem)}
                className="flex-1 responsive-btn bg-slate-600 text-white hover:bg-slate-700 transition rounded-xl"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;