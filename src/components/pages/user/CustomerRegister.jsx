import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { setDoc, doc } from 'firebase/firestore';

function CustomerRegister() {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long!');
      return;
    }

    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Save user profile to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name,
        email,
        phone: mobile,
        type: 'customer',
        uid: userCredential.user.uid,
        createdAt: new Date(),
      });
      setSuccess('Customer registered successfully! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 flex items-center justify-center main-content bg-gray-100">
      <div className="responsive-card responsive-p-6 sm:responsive-p-8 w-full max-w-md mx-auto">
        <h2 className="responsive-text-xl sm:responsive-text-2xl font-bold mb-6 text-center text-gray-900">Customer Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email Address"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Mobile Number"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
          <button 
            className="w-full responsive-btn bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold touch-target" 
            type="submit"
          >
            Register
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-center responsive-text-sm">{error}</div>}
        {success && <div className="text-green-600 mt-4 text-center responsive-text-sm">{success}</div>}
        
        <div className="mt-6 text-center">
          <p className="responsive-text-sm text-gray-600">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:underline font-semibold">
              Login here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerRegister; 