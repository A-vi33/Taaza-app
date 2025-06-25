import React from 'react';
import { useNavigate } from 'react-router-dom';

function CustomerLogin() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <button
          className="w-full bg-green-600 text-white py-3 rounded mb-4 text-lg font-semibold"
          onClick={() => navigate('/login/customer')}
        >
          Customer Login
        </button>
        <button
          className="w-full bg-blue-600 text-white py-3 rounded text-lg font-semibold"
          onClick={() => navigate('/login')}
        >
          Admin Login
        </button>
      </div>
    </div>
  );
}

export default CustomerLogin; 