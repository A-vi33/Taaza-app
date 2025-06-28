import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDrumstickBite, FaUsersCog, FaClipboardList, FaTruck, FaCog, FaChartBar, FaSignOutAlt } from 'react-icons/fa';
 
const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/admin/transaction', label: 'Transaction', icon: <FaChartBar />},
  { to: '/admin/products', label: 'Products', icon: <FaDrumstickBite /> },
  { to: '/admin/employees', label: 'Employees', icon: <FaUsersCog /> },
  { to: '/admin/orders', label: 'Orders', icon: <FaClipboardList /> },
  { to: '/admin/delivery', label: 'Delivery', icon: <FaTruck /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <FaChartBar /> },
  { to: '/admin/settings', label: 'Settings', icon: <FaCog /> },
];
 
function AdminLayout({ children }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="page-container flex flex-col bg-gray-100">
      {/* Mobile Menu Button */}
      <button 
        className="fixed top-4 right-4 z-50 lg:hidden responsive-btn bg-white shadow-lg rounded-lg touch-target"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>
      
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Admin Title */}
            <div className="flex items-center">
              <h1 className="responsive-text-xl sm:responsive-text-2xl font-bold text-green-700">
                🏪 Taaza Admin
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {adminLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg responsive-text-sm font-medium transition-colors touch-target ${
                    location.pathname.startsWith(link.to) 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                  }`}
                  title={link.label}
                >
                  <span className="responsive-text-base">{link.icon}</span> 
                  {link.label}
                </Link>
              ))}
              
              {/* Logout Button */}
              <Link 
                to="/login" 
                className="flex items-center gap-2 px-3 py-2 rounded-lg responsive-text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors touch-target ml-2"
              >
                <FaSignOutAlt /> Logout
              </Link>
            </div>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {adminLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg responsive-text-base font-medium transition-colors touch-target ${
                    location.pathname.startsWith(link.to) 
                      ? 'bg-green-100 text-green-700' 
                      : 'text-gray-700 hover:bg-green-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="responsive-text-lg">{link.icon}</span> 
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile Logout */}
              <Link 
                to="/login" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg responsive-text-base font-medium text-red-600 hover:bg-red-50 transition-colors touch-target"
                onClick={() => setMobileMenuOpen(false)}
              >
                <FaSignOutAlt /> Logout
              </Link>
            </div>
          </div>
        )}
      </nav>
      
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Main Content */}
      <main className="flex-1 responsive-p-4 sm:responsive-p-6 lg:responsive-p-8 overflow-y-auto overflow-x-hidden">
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default AdminLayout;