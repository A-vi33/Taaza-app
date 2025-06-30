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
      let docId;
      if (querySnapshot.empty) {
        // Create new user for customers only. Admins must be created in the DB.
        const newUser = {
          name: name.trim(),
          mobile: mobile,
          type: 'customer',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        };
        
        // Add to Firestore
        const docRef = await addDoc(collection(db, 'users'), newUser);
        docId = docRef.id;
        userData = newUser;
        showToast('New user account created successfully!', 'success');
      } else {
        // Existing user found
        const existingUserDoc = querySnapshot.docs[0];
        docId = existingUserDoc.id;
        userData = existingUserDoc.data();
        
        showToast(`Welcome back, ${userData.name}!`, 'success');
        
        // Update last login time
        await setDoc(doc(db, 'users', docId), {
          lastLogin: serverTimestamp()
        }, { merge: true });
      }

      // Set user in context
      const isAdmin = userData.type === 'admin';
      setUser({
        id: docId,
        name: userData.name,
        mobile: userData.mobile,
        type: userData.type,
        isAdmin: isAdmin,
      });

      // Navigate based on role
      if (isAdmin) {
        setTimeout(() => navigate('/admin/dashboard'), 1000);
      } else {
        setTimeout(() => navigate('/'), 1000);
      }

    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Toast message={toast.message} show={toast.show} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      <div className="flex flex-col lg:flex-row w-full max-w-4xl bg-transparent rounded-2xl overflow-hidden shadow-2xl">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 bg-transparent p-8 sm:p-12 flex flex-col justify-center order-2 lg:order-1">
          <h2 className="text-white text-4xl font-bold mb-8 text-left">Welcome to Taaza</h2>
          <form onSubmit={handleLogin} className="w-full max-w-md">
            <div className="mb-4">
              <label className="text-white font-medium mb-2 block text-lg">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 bg-transparent text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="text-white font-medium mb-2 block text-lg">Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter your 10-digit mobile number"
                maxLength="10"
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-700 bg-transparent text-white text-lg focus:outline-none focus:border-red-500 transition-colors"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  checkExistingUser(e.target.value);
                }}
                required
              />
              {checkingMobile && (
                <div className="text-yellow-500 text-sm mt-2">
                  Checking mobile number...
                </div>
              )}
              {existingUser && (
                <div className="text-green-400 text-sm mt-2 p-3 bg-green-900/50 rounded-lg border border-green-700">
                  ✅ Welcome back! Your registered name has been auto-filled.
                </div>
              )}
            </div>
            <button className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold text-xl mb-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300" type="submit" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-gray-400 text-base text-left">By signing in, you agree to our terms and conditions</p>
            </div>
          </form>
        </div>
        
        {/* Image Section */}
        <div className="w-full lg:w-1/2 flex bg-gradient-to-br from-gray-900 to-black items-center justify-center relative p-8 order-1 lg:order-2">
          <div className="text-center text-white z-10 flex flex-col items-center gap-6">
            <img 
              src={bgImg} 
              alt="Taaza" 
              className="w-4/5 max-w-sm h-auto rounded-2xl shadow-lg"
            />
            <div className="mt-4">
              <h3 className="text-3xl font-bold mb-2">Fresh Meat Market</h3>
              <p className="text-lg opacity-90">Quality products, delivered fresh</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimpleLogin; 