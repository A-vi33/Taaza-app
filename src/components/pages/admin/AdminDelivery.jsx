import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../../firebase';
import Toast from '../../Toast';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminDelivery() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [form, setForm] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    driverName: '',
    driverPhone: '',
    status: 'pending'
  });

  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length;

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
      return;
    }
    if (!authLoading && user && user.isAdmin) {
      fetchDeliveries();
    }
  }, [user, authLoading, navigate]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'deliveries'));
      const deliveriesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDeliveries(deliveriesData);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      showToast('Error fetching deliveries', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(doc(db, 'deliveries', editingId), form);
        showToast('Delivery updated successfully');
      } else {
        await addDoc(collection(db, 'deliveries'), {
          ...form,
          createdAt: new Date().toISOString()
        });
        showToast('Delivery added successfully');
      }
      setForm({
        orderId: '',
        customerName: '',
        customerPhone: '',
        deliveryAddress: '',
        driverName: '',
        driverPhone: '',
        status: 'pending'
      });
      setEditingId(null);
      fetchDeliveries();
    } catch (error) {
      console.error('Error saving delivery:', error);
      showToast('Error saving delivery', 'error');
    }
  };

  const handleEdit = (delivery) => {
    setForm(delivery);
    setEditingId(delivery.id);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this delivery?')) {
      try {
        await deleteDoc(doc(db, 'deliveries', id));
        showToast('Delivery deleted successfully');
        fetchDeliveries();
      } catch (error) {
        console.error('Error deleting delivery:', error);
        showToast('Error deleting delivery', 'error');
      }
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'deliveries', id), { status: newStatus });
      showToast(`Delivery status updated to ${newStatus}`);
      fetchDeliveries();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Error updating status', 'error');
    }
  };

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
                    🚚
                  </div>
                  Delivery Management
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Track and manage delivery operations and driver assignments
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  🚚 {deliveries.length} Deliveries
                </div>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  ✅ {completedDeliveries} Completed
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Delivery Form */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20 mb-8 animate-fade-in">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Add/Edit Delivery
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input 
                name="orderId" 
                value={form.orderId} 
                onChange={handleChange} 
                placeholder="Order ID" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
              <input 
                name="customerName" 
                value={form.customerName} 
                onChange={handleChange} 
                placeholder="Customer Name" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
              <input 
                name="customerPhone" 
                value={form.customerPhone} 
                onChange={handleChange} 
                placeholder="Customer Phone" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
              <input 
                name="deliveryAddress" 
                value={form.deliveryAddress} 
                onChange={handleChange} 
                placeholder="Delivery Address" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
              <input 
                name="driverName" 
                value={form.driverName} 
                onChange={handleChange} 
                placeholder="Driver Name" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
              <input 
                name="driverPhone" 
                value={form.driverPhone} 
                onChange={handleChange} 
                placeholder="Driver Phone" 
                className="responsive-btn border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                style={{ fontFamily: 'Inter, sans-serif' }}
                required 
              />
            </div>
            <div className="flex gap-2">
              <button 
                className="bg-slate-600 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-slate-700 transition font-semibold" 
                type="submit"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {editingId ? 'Update' : 'Add'} Delivery
              </button>
              {editingId && (
                <button 
                  type="button" 
                  className="px-6 py-3 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-sm" 
                  onClick={() => { setForm({ orderId: '', customerName: '', customerPhone: '', deliveryAddress: '', driverName: '', driverPhone: '', status: 'pending' }); setEditingId(null); }}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Deliveries List */}
        <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
          <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-6 text-slate-800 flex items-center gap-2" 
              style={{ fontFamily: 'Montserrat, sans-serif' }}>
            <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
              📋
            </div>
            Delivery Tracking
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🔄 Loading deliveries...
              </div>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-slate-600 responsive-text-lg font-medium" 
                   style={{ fontFamily: 'Inter, sans-serif' }}>
                🚚 No deliveries found
              </div>
              <p className="text-slate-500 responsive-text-sm mt-2" 
                 style={{ fontFamily: 'Inter, sans-serif' }}>
                Add your first delivery using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map(delivery => (
                <div key={delivery.id} className="group relative bg-yellow-100 backdrop-blur-md border-2 border-white/20 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden p-4">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-900 responsive-text-lg" 
                            style={{ fontFamily: 'Montserrat, sans-serif' }}>
                          Order #{delivery.orderId}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          delivery.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : delivery.status === 'in-transit' 
                            ? 'bg-blue-100 text-blue-800' 
                            : delivery.status === 'pending' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`} 
                        style={{ fontFamily: 'Inter, sans-serif' }}>
                          {delivery.status === 'completed' ? '✅ Completed' : delivery.status === 'in-transit' ? '🚚 In Transit' : delivery.status === 'pending' ? '⏳ Pending' : '❌ Failed'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Customer:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.customerName}
                          </p>
                          <p className="text-slate-600 text-xs" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.customerPhone}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Driver:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.driverName}
                          </p>
                          <p className="text-slate-600 text-xs" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.driverPhone}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-slate-600 font-medium" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Address:
                          </p>
                          <p className="font-semibold text-slate-900 text-xs" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.deliveryAddress}
                          </p>
                        </div>
                      </div>
                      
                      {delivery.estimatedDelivery && (
                        <div className="mt-3 p-3 bg-white/80 rounded-lg border border-slate-200">
                          <p className="text-slate-600 font-medium mb-1" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            Estimated Delivery:
                          </p>
                          <p className="font-semibold text-slate-900" 
                             style={{ fontFamily: 'Inter, sans-serif' }}>
                            {delivery.estimatedDelivery}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleEdit(delivery)} 
                        className="bg-slate-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-slate-700 transition shadow-sm font-semibold" 
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(delivery.id)} 
                        className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-red-700 transition shadow-sm font-semibold" 
                        style={{ fontFamily: 'Inter, sans-serif' }}
                      >
                        Delete
                      </button>
                      {delivery.status === 'pending' && (
                        <button 
                          onClick={() => handleStatusUpdate(delivery.id, 'in-transit')} 
                          className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 transition shadow-sm font-semibold" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Start Delivery
                        </button>
                      )}
                      {delivery.status === 'in-transit' && (
                        <button 
                          onClick={() => handleStatusUpdate(delivery.id, 'completed')} 
                          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-700 transition shadow-sm font-semibold" 
                          style={{ fontFamily: 'Inter, sans-serif' }}
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDelivery; 