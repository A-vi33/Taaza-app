import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, query, orderBy } from 'firebase/firestore';
import Toast from '../../Toast';
import { sendOrderNotifications } from '../../../utils/notifications';
import { generateOrderId, printOrderReceipt } from '../../../utils/orderUtils';

function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemWeight, setItemWeight] = useState(500);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

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

  // Fetch products for admin to purchase
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

  useEffect(() => {
    fetchProducts();
  }, []);

  // Product filtering logic
  const [activeFilter, setActiveFilter] = useState('all');
  const groupedItems = {
    chicken: products.filter(item => item.category === 'chicken'),
    mutton: products.filter(item => item.category === 'mutton'),
    goat: products.filter(item => item.category === 'goat')
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
  
  // NEW: Modified to create order immediately when item is added to cart
  const handleConfirmAddToCart = async (item) => {
    try {
      const price = calculatePrice(item, itemWeight);
      const cartItem = {
        ...item,
        weight: itemWeight,
        price: parseFloat(price),
        quantity: 1,
        customerInfo: { name: 'Walk-in Customer', phone: 'N/A', email: '' }
      };

      // Generate sequential order ID
      const orderId = await generateOrderId();
      
      // Create order immediately
      const orderRef = await addDoc(collection(db, 'orders'), {
        orderId: orderId,
        cart: [cartItem],
        status: 'confirmed',
        paymentMethod: 'cash',
        createdAt: serverTimestamp(),
        total: price,
        customerName: 'Walk-in Customer',
        customerPhone: 'N/A',
        customerEmail: '',
        source: 'admin'
      });

      // Decrease product stock
      const productRef = doc(db, 'products', item.id);
      const productSnap = await getDoc(productRef);
      if (productSnap.exists()) {
        const currentQty = productSnap.data().quantity || 0;
        const boughtKg = (itemWeight || 0) / 1000;
        let newQty = currentQty - boughtKg;
        if (newQty < 0) newQty = 0;
        await updateDoc(productRef, { quantity: newQty });
      }

      // Add transaction record
      await addDoc(collection(db, 'transactions'), {
        orderId: orderRef.id,
        orderNumber: orderId,
        amount: price,
        items: [cartItem],
        status: 'completed',
        paymentMethod: 'cash',
        createdAt: serverTimestamp(),
        customer: { name: 'Walk-in Customer', phone: 'N/A', email: '' }
      });

      // Print receipt
      const orderData = {
        orderId: orderId,
        id: orderRef.id
      };
      printOrderReceipt(orderData, [cartItem], 'Walk-in Customer', 'N/A');

      // Show success message
      setToast({ 
        show: true, 
        message: `Order #${orderId} created successfully! Receipt printed.`, 
        type: 'success' 
      });

      // Reset form
      setShowCustomerForm(false);
      setSelectedItem(null);
      setCustomerInfo({ name: '', phone: '', email: '' });
      
      // Refresh data
      await fetchOrders();
      await fetchProducts();

    } catch (error) {
      console.error('Error creating order:', error);
      setToast({ show: true, message: 'Error creating order: ' + error.message, type: 'error' });
    }
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
              Create Orders (Cash Payment)
            </h2>
            
            {/* Category Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
              {['all', 'chicken', 'mutton', 'goat'].map(cat => (
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

        {/* Customer Details Modal */}
        {showCustomerForm && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
              <h3 className="responsive-text-xl font-bold mb-4 text-slate-800" 
                  style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Create Order - {selectedItem.name}
              </h3>
              
              <div className="space-y-4">
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
                  className="flex-1 responsive-btn bg-green-600 text-white hover:bg-green-700 transition rounded-xl"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  🖨️ Create Order & Print
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;