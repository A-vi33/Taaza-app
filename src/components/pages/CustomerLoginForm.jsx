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
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Customer Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-2 border rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="tel"
            placeholder="Mobile Number (Password)"
            className="w-full mb-3 p-2 border rounded"
            value={mobile}
            onChange={e => setMobile(e.target.value)}
            required
          />
          <button className="w-full bg-green-600 text-white py-2 rounded" type="submit">
            Login
          </button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        <div className="mt-4 text-center">
          <a href="/register" className="text-blue-600 underline">Don't have an account? Register here</a>
        </div>
      </div>
    </div>
  );
}

export default CustomerLoginForm; 