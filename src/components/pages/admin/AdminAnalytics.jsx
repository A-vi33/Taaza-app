import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import Toast from '../../Toast';

function AdminAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Analytics data
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [outOfStockItems, setOutOfStockItems] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState(0);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersQuery = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch products
      const productsQuery = query(collection(db, 'products'));
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch employees
      const employeesQuery = query(collection(db, 'employees'));
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate analytics
      const revenue = ordersData.reduce((sum, order) => {
        return sum + (order.cart?.reduce((cartSum, item) => cartSum + (item.price * item.quantity), 0) || 0);
      }, 0);
      
      const pending = ordersData.filter(order => order.status === 'pending').length;
      const completed = ordersData.filter(order => order.status === 'paid').length;
      
      const lowStock = productsData.filter(product => product.quantity <= 5 && product.quantity > 0).length;
      const outOfStock = productsData.filter(product => product.quantity <= 0).length;
      
      const active = employeesData.filter(emp => !emp.leaves || emp.leaves.filter(leave => leave.status === 'approved' && new Date(leave.endDate) > new Date()).length === 0).length;
      const onLeave = employeesData.filter(emp => emp.leaves && emp.leaves.filter(leave => leave.status === 'approved' && new Date(leave.endDate) > new Date()).length > 0).length;
      
      setTotalRevenue(revenue);
      setTotalOrders(ordersData.length);
      setTotalProducts(productsData.length);
      setTotalEmployees(employeesData.length);
      setPendingOrders(pending);
      setCompletedOrders(completed);
      setLowStockItems(lowStock);
      setOutOfStockItems(outOfStock);
      setActiveEmployees(active);
      setOnLeaveEmployees(onLeave);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setToast({ show: true, message: 'Error loading analytics data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-6xl mx-auto">
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
                  Analytics Dashboard
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Comprehensive insights and performance metrics for your business
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  📈 Live Data
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  🔄 Real-time
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="responsive-grid-1 sm:responsive-grid-2 lg:responsive-grid-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Total Revenue
                </p>
                <p className="text-2xl font-bold text-slate-900" 
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  ₹{totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-slate-900" 
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {totalOrders}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Total Products
                </p>
                <p className="text-2xl font-bold text-slate-900" 
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {totalProducts}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏪</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <div className="flex items-center justify-between">
    <div>
                <p className="text-slate-600 font-medium text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Total Employees
                </p>
                <p className="text-2xl font-bold text-slate-900" 
                   style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {totalEmployees}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Charts Section */}
        <div className="responsive-grid-1 lg:responsive-grid-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                📈
              </div>
              Revenue Trends
            </h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-slate-600 font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Revenue Chart
                </p>
                <p className="text-slate-500 text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Chart visualization would be implemented here
                </p>
              </div>
            </div>
          </div>
          
          {/* Orders Chart */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl border border-white/20 animate-fade-in-up">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                📦
              </div>
              Order Statistics
            </h3>
            <div className="h-64 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-200">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <p className="text-slate-600 font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Orders Chart
                </p>
                <p className="text-slate-500 text-sm" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                  Chart visualization would be implemented here
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔔
            </div>
            Recent Activity
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading analytics...
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Revenue Summary
                    </p>
                    <p className="text-slate-600 text-sm" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total revenue: ₹{totalRevenue.toFixed(2)} | Average order value: ₹{(totalRevenue / totalOrders || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📦</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Order Summary
                    </p>
                    <p className="text-slate-600 text-sm" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total orders: {totalOrders} | Pending orders: {pendingOrders} | Completed orders: {completedOrders}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏪</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Product Summary
                    </p>
                    <p className="text-slate-600 text-sm" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total products: {totalProducts} | Low stock items: {lowStockItems} | Out of stock: {outOfStockItems}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">👥</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Employee Summary
                    </p>
                    <p className="text-slate-600 text-sm" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                      Total employees: {totalEmployees} | Active employees: {activeEmployees} | On leave: {onLeaveEmployees}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics; 