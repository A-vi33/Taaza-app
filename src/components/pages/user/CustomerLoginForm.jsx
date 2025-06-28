import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function CustomerLoginForm() {
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, mobile);
      navigate('/');
    } catch (err) {
      setError('Invalid email or mobile number.');
    }
  };

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 flex items-center justify-center main-content bg-gray-100">
      <div className="responsive-card responsive-p-6 sm:responsive-p-8 w-full max-w-md mx-auto">
        <h2 className="responsive-text-xl sm:responsive-text-2xl font-bold mb-6 text-center text-gray-900">Customer Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Mobile Number (Password)"
            className="responsive-btn border rounded w-full focus:ring-2 focus:ring-green-400 transition touch-target"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            required
          />
          <button 
            className="w-full responsive-btn bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold touch-target" 
            type="submit"
          >
            Login
          </button>
        </form>
        {error && <div className="text-red-600 mt-4 text-center responsive-text-sm">{error}</div>}
        
        <div className="mt-6 text-center">
          <p className="responsive-text-sm text-gray-600">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:underline font-semibold">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerLoginForm; 