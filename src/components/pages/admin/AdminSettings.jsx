import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import Toast from '../../Toast';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminSettings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [settings, setSettings] = useState({
    storeName: 'Taaza Fresh Meat',
    storeAddress: '',
    contactPhone: '',
    contactEmail: '',
    openingTime: '09:00',
    closingTime: '18:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    currency: 'INR',
    taxRate: 5.0,
    minOrderAmount: 100,
    emailNotifications: true,
    smsNotifications: true,
    lowStockAlerts: true
  });

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      navigate('/login');
      return;
    }
    if (!authLoading && user && user.isAdmin) {
      fetchSettings();
    }
  }, [user, authLoading, navigate]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showToast('Error fetching settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'settings', 'general'), settings);
      showToast('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Error saving settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative main-content min-h-screen bg-green-100">
      <div className="relative z-10 responsive-p-4 sm:responsive-p-8 max-w-4xl mx-auto">
        <Toast message={toast.message} show={toast.show} onClose={() => setToast({ ...toast, show: false })} type={toast.type} />
        
        {/* Enhanced Page Header */}
        <div className="mb-8 pb-6 border-b border-white/20">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="responsive-text-3xl sm:responsive-text-4xl font-bold text-slate-800 mb-2 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">
                    ⚙️
                  </div>
                  System Settings
                </h2>
                <p className="text-slate-600 responsive-text-base sm:responsive-text-lg font-medium">
                  Configure application settings and manage system preferences
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  ✅ Active
                </div>
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold text-sm">
                  🔧 Configured
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Settings Sections */}
        <div className="responsive-grid-1 lg:responsive-grid-2 gap-8">
          {/* General Settings */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                🏪
              </div>
              General Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Store Name
                </label>
                <input 
                  type="text" 
                  value={settings.storeName} 
                  onChange={(e) => setSettings({...settings, storeName: e.target.value})} 
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Store Address
                </label>
                <textarea 
                  value={settings.storeAddress} 
                  onChange={(e) => setSettings({...settings, storeAddress: e.target.value})} 
                  rows="3"
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Contact Phone
                </label>
                <input 
                  type="tel" 
                  value={settings.contactPhone} 
                  onChange={(e) => setSettings({...settings, contactPhone: e.target.value})} 
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Contact Email
                </label>
                <input 
                  type="email" 
                  value={settings.contactEmail} 
                  onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} 
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>
          </div>
          
          {/* Business Hours */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                🕒
              </div>
              Business Hours
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                    Opening Time
                  </label>
                  <input 
                    type="time" 
                    value={settings.openingTime} 
                    onChange={(e) => setSettings({...settings, openingTime: e.target.value})} 
                    className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" 
                         style={{ fontFamily: 'Inter, sans-serif' }}>
                    Closing Time
                  </label>
                  <input 
                    type="time" 
                    value={settings.closingTime} 
                    onChange={(e) => setSettings({...settings, closingTime: e.target.value})} 
                    className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Working Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        checked={settings.workingDays.includes(day)} 
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({...settings, workingDays: [...settings.workingDays, day]});
                          } else {
                            setSettings({...settings, workingDays: settings.workingDays.filter(d => d !== day)});
                          }
                        }} 
                        className="rounded border-slate-300 text-slate-600 focus:ring-slate-400"
                      />
                      <span className="text-sm text-slate-700" 
                            style={{ fontFamily: 'Inter, sans-serif' }}>
                        {day}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Payment Settings */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                💳
              </div>
              Payment Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Currency
                </label>
                <select 
                  value={settings.currency} 
                  onChange={(e) => setSettings({...settings, currency: e.target.value})} 
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Tax Rate (%)
                </label>
                <input 
                  type="number" 
                  value={settings.taxRate} 
                  onChange={(e) => setSettings({...settings, taxRate: parseFloat(e.target.value)})} 
                  min="0" 
                  max="100" 
                  step="0.1"
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1" 
                       style={{ fontFamily: 'Inter, sans-serif' }}>
                  Minimum Order Amount
                </label>
                <input 
                  type="number" 
                  value={settings.minOrderAmount} 
                  onChange={(e) => setSettings({...settings, minOrderAmount: parseFloat(e.target.value)})} 
                  min="0" 
                  step="0.01"
                  className="responsive-btn border-2 border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all duration-200 bg-white/90 text-slate-900 font-medium shadow-sm" 
                  style={{ fontFamily: 'Inter, sans-serif' }}
                />
              </div>
            </div>
          </div>
          
          {/* Notification Settings */}
          <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-xl animate-fade-in-up border border-white/20">
            <h3 className="responsive-text-lg sm:responsive-text-xl font-bold mb-4 text-slate-800 flex items-center gap-2" 
                style={{ fontFamily: 'Montserrat, sans-serif' }}>
              <div className="w-8 h-8 bg-slate-600 rounded-lg flex items-center justify-center text-white text-sm">
                🔔
              </div>
              Notification Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Email Notifications
                  </p>
                  <p className="text-sm text-slate-600" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Receive order notifications via email
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.emailNotifications} 
                    onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    SMS Notifications
                  </p>
                  <p className="text-sm text-slate-600" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Receive order notifications via SMS
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.smsNotifications} 
                    onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Low Stock Alerts
                  </p>
                  <p className="text-sm text-slate-600" 
                     style={{ fontFamily: 'Inter, sans-serif' }}>
                    Get notified when products are low in stock
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.lowStockAlerts} 
                    onChange={(e) => setSettings({...settings, lowStockAlerts: e.target.checked})} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleSaveSettings} 
            disabled={loading}
            className="responsive-btn bg-gradient-to-r from-slate-600 to-slate-700 text-white font-semibold rounded-xl px-8 py-3 transition-all duration-300 hover:from-slate-700 hover:to-slate-800 transform hover:scale-105 shadow-lg touch-target disabled:opacity-50 disabled:cursor-not-allowed" 
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminSettings; 