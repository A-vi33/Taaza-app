import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import bgImg from '../../../assets/bg.jpg';

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

function SimpleLogin() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [existingUser, setExistingUser] = useState(null);
  const [checkingMobile, setCheckingMobile] = useState(false);

  // Fixed admin credentials
  const ADMIN_NAME = 'Admin';
  const ADMIN_MOBILE = '9876543210';

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const checkExistingUser = async (mobileNumber) => {
    if (mobileNumber.length === 10 && /^\d+$/.test(mobileNumber)) {
      setCheckingMobile(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('mobile', '==', mobileNumber));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const user = querySnapshot.docs[0].data();
          setExistingUser(user);
          setName(user.name); // Auto-fill the original name
        } else {
          setExistingUser(null);
        }
      } catch (error) {
        console.error('Error checking existing user:', error);
      } finally {
        setCheckingMobile(false);
      }
    } else {
      setExistingUser(null);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if it's admin login
      if (name.trim().toLowerCase() === ADMIN_NAME.toLowerCase() && mobile === ADMIN_MOBILE) {
        setUser({ 
          type: 'admin', 
          name: ADMIN_NAME, 
          mobile: ADMIN_MOBILE,
          isAdmin: true 
        });
        showToast('Admin login successful!', 'success');
        setTimeout(() => navigate('/admin/dashboard'), 1000);
        return;
      }

      // Validate user input
      if (!name.trim() || !mobile.trim()) {
        showToast('Please enter both name and mobile number', 'error');
        setLoading(false);
        return;
      }

      if (mobile.length !== 10 || !/^\d+$/.test(mobile)) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        setLoading(false);
        return;
      }

      // Check if user exists in database
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('mobile', '==', mobile));
      const querySnapshot = await getDocs(q);

      let userData;
      if (querySnapshot.empty) {
        // Create new user
        const newUser = {
          name: name.trim(),
          mobile: mobile,
          type: 'customer',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'users'), newUser);
        userData = { ...newUser, id: docRef.id };
        showToast('New user account created successfully!', 'success');
      } else {
        // Existing user found - use the original name from database
        const existingUser = querySnapshot.docs[0];
        userData = { id: existingUser.id, ...existingUser.data() };
        
        // Check if the provided name is different from the stored name
        if (name.trim().toLowerCase() !== userData.name.toLowerCase()) {
          showToast(`Welcome back! Your registered name is: ${userData.name}`, 'success');
        } else {
          showToast('Welcome back!', 'success');
        }
        
        // Update last login time
        await setDoc(doc(db, 'users', existingUser.id), {
          ...userData,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      // Set user in context with the name from database (original name)
      setUser({
        type: 'customer',
        name: userData.name, // Always use the name from database
        mobile: userData.mobile,
        id: userData.id,
        isAdmin: false
      });

      // Navigate to home page
      setTimeout(() => navigate('/'), 1000);

    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'flex', width: '900px', maxWidth: '98vw', background: 'transparent', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
        {/* Left: Form */}
        <div style={{ flex: 1, background: 'transparent', padding: '3.5rem 2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '2.2rem', fontWeight: 700, marginBottom: 32, textAlign: 'left' }}>Welcome to Taaza</h2>
          <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 400 }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#fff', fontWeight: 500, marginBottom: 6, display: 'block', fontSize: 16 }}>Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: 10, border: '1.5px solid #3a3232', background: 'transparent', color: '#fff', fontSize: 16, outline: 'none', marginTop: 4, marginBottom: 2 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#fff', fontWeight: 500, marginBottom: 6, display: 'block', fontSize: 16 }}>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter your 10-digit mobile number"
                maxLength="10"
                style={{ width: '100%', padding: '0.9rem 1.1rem', borderRadius: 10, border: '1.5px solid #3a3232', background: 'transparent', color: '#fff', fontSize: 16, outline: 'none', marginTop: 4, marginBottom: 2 }}
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  checkExistingUser(e.target.value);
                }}
                required
              />
              {checkingMobile && (
                <div style={{ color: '#f39c12', fontSize: 14, marginTop: 4 }}>
                  Checking mobile number...
                </div>
              )}
              {existingUser && (
                <div style={{ color: '#00b894', fontSize: 14, marginTop: 4, padding: '8px 12px', backgroundColor: 'rgba(0,184,148,0.1)', borderRadius: '6px', border: '1px solid #00b894' }}>
                  ✅ Welcome back! Your registered name has been auto-filled.
                </div>
              )}
            </div>
            <button style={{ width: '100%', background: '#e74c3c', color: 'white', padding: '0.9rem', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 18, marginBottom: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(231,76,60,0.10)' }} type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            {toast.show && (
              <div style={{ 
                color: toast.type === 'success' ? '#00b894' : '#ff7675', 
                marginTop: 8, 
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: toast.type === 'success' ? 'rgba(0,184,148,0.1)' : 'rgba(255,118,117,0.1)',
                border: `1px solid ${toast.type === 'success' ? '#00b894' : '#ff7675'}`
              }}>
                {toast.message}
              </div>
            )}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ color: '#b2bec3', fontSize: 15, textAlign: 'left', width: 'fit-content' }}>By signing in, you agree to our terms and conditions</p>
            </div>
          </form>
        </div>
        {/* Right: Image */}
        <div style={{ flex: 1, background: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(11, 9, 12) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ textAlign: 'center', color: 'white', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <img 
              src={bgImg} 
              alt="Taaza" 
              style={{ 
                width: '80%', 
                maxWidth: '350px', 
                height: 'auto', 
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }} 
            />
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>Fresh Meat Market</h3>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, fontWeight: 400 }}>Quality products, delivered fresh</p>
            </div>
          </div>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            background: 'rgba(0,0,0,0.3)', 
            zIndex: 1 
          }}></div>
        </div>
      </div>
    </div>
  );
}

export default SimpleLogin; 