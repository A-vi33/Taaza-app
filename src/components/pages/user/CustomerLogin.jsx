import React from 'react';
import { useNavigate } from 'react-router-dom';

function CustomerLogin() {
  const navigate = useNavigate();

  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 flex items-center justify-center main-content bg-gray-100">
      <div className="responsive-card responsive-p-6 sm:responsive-p-8 w-full max-w-md mx-auto text-center">
        <h2 className="responsive-text-xl sm:responsive-text-2xl font-bold mb-8 text-gray-900">Login</h2>
        <div className="space-y-4">
          <button
            className="w-full responsive-btn bg-green-600 text-white rounded hover:bg-green-700 transition font-semibold touch-target"
            onClick={() => navigate('/login/customer')}
          >
            Customer Login
          </button>
          <button
            className="w-full responsive-btn bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold touch-target"
            onClick={() => navigate('/login')}
          >
            Admin Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerLogin; 