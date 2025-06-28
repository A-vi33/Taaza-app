import React from 'react';

function AdminAnalytics() {
  return (
    <div className="responsive-container responsive-p-4 sm:responsive-p-8 main-content">
      {/* Page Title */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h2 className="responsive-text-2xl sm:responsive-text-3xl font-bold text-gray-800 text-center sm:text-left">
          📊 Analytics Dashboard
        </h2>
        <p className="text-gray-600 responsive-text-sm sm:responsive-text-base text-center sm:text-left mt-2">
          View business insights and performance metrics
        </p>
      </div>
      
      <div className="text-center py-12">
        <div className="text-gray-500 responsive-text-lg font-medium">
          📊 Analytics Features Coming Soon
        </div>
        <p className="text-gray-400 responsive-text-sm mt-2">
          Advanced analytics and reporting features will be available here.
        </p>
      </div>
    </div>
  );
}

export default AdminAnalytics; 