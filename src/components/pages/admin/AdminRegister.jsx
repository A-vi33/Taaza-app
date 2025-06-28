import React, { useState, useEffect } from 'react';
import { getAuth, fetchSignInMethodsForEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function AdminRegister() {
  const [email, setEmail] = useState('admin@taaza.com');
  const [password, setPassword] = useState('');
  const [adminExists, setAdminExists] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const auth = getAuth();
      try {
        const methods = await fetchSignInMethodsForEmail(auth, 'admin@taaza.com');
        if (methods.length > 0) {
          setAdminExists(true);
          setTimeout(() => navigate('/login'), 1500);
        }
      } catch (e) {
        setAdminExists(false);
      }
    };
    checkAdmin();
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (adminExists) return;
    try {
      const auth = getAuth();
      await createUserWithEmailAndPassword(auth, email, password);
      setSuccess('Admin registered! Please login.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  if (adminExists) {
    return (
      <div className="flex items-center justify-center main-content bg-gray-100">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Admin Already Registered</h2>
          <p className="text-gray-500">Redirecting to admin login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center main-content bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Admin Register</h2>
        <form onSubmit={handleRegister}>
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full mb-3 p-2 border rounded"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-3 p-2 border rounded"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="w-full bg-blue-600 text-white py-2 rounded" type="submit">
            Register
          </button>
        </form>
        {error && <div className="text-red-600 mt-2">{error}</div>}
        {success && <div className="text-green-600 mt-2">{success}</div>}
      </div>
    </div>
  );
}

export default AdminRegister; 