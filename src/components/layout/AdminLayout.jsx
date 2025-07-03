import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDrumstickBite, FaUsersCog, FaClipboardList, FaTruck, FaCog, FaChartBar, FaSignOutAlt, FaBars, FaTimes, FaUser, FaSearch, FaCaretDown, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import bgImg from '../../assets/bg.jpg';
 
const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/admin/transaction', label: 'Transaction', icon: <FaChartBar />},
  { to: '/admin/products', label: 'Products', icon: <FaDrumstickBite /> },
  { to: '/admin/employees', label: 'Employees', icon: <FaUsersCog /> },
  { to: '/admin/orders', label: 'Orders', icon: <FaClipboardList /> },
  // { to: '/admin/delivery', label: 'Delivery', icon: <FaTruck /> }, // REMOVED/COMMENTED OUT
  { to: '/admin/analytics', label: 'Analytics', icon: <FaChartBar /> },
  { to: '/admin/settings', label: 'Settings', icon: <FaCog /> },
];
 
function AdminLayout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="min-h-screen flex bg-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white/95 backdrop-blur-md shadow-2xl transform transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-4 border-b border-slate-200 bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 shadow-lg">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                🏪
              </div>
              <span className="font-extrabold tracking-wide">Taaza Admin</span>
            </h1>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto">
              🏪
            </div>
          )}
          <div className="flex items-center gap-2">
            <button 
              className="lg:hidden text-white hover:text-slate-200 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <FaTimes size={16} />
            </button>
            <button 
              className="hidden lg:block text-white hover:text-slate-200 transition-colors"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <FaChevronRight size={16} /> : <FaChevronLeft size={16} />}
            </button>
          </div>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="mt-6 px-2 h-[calc(100vh-120px)] overflow-y-auto">
          <div className="space-y-2">
          {adminLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
                className={`flex items-center gap-3 px-3 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative ${
                  location.pathname.startsWith(link.to) 
                    ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg scale-105 border-l-4 border-white' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800 hover:border-l-4 hover:border-slate-400 hover:scale-105'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? link.label : ''}
              >
                <span className={`text-lg transition-colors ${
                  location.pathname.startsWith(link.to) 
                    ? 'text-white' 
                    : 'text-slate-500 group-hover:text-slate-700'
                }`}>
                  {link.icon}
                </span>
                {!sidebarCollapsed && (
                  <span className="font-semibold">{link.label}</span>
                )}
                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {link.label}
                  </div>
                )}
            </Link>
          ))}
          </div>
          
          {/* Logout Section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <button 
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 px-3 py-4 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-300 group hover:scale-105 relative ${
                sidebarCollapsed ? 'justify-center' : ''
              }`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <span className="text-lg text-red-500 group-hover:text-red-600">
                <FaSignOutAlt />
              </span>
              {!sidebarCollapsed && (
                <span className="font-semibold">Logout</span>
              )}
              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-red-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  Logout
                </div>
              )}
            </button>
          </div>
        </nav>
      </div>
      
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Professional Top Header Bar */}
        <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-30 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left Section - Mobile Menu */}
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <FaBars size={20} />
              </button>
            </div>
            
            {/* Center Section - Page Title */}
            <div className="hidden lg:flex items-center">
              <h1 className="text-lg font-bold text-slate-900">
                Taaza Management System
              </h1>
            </div>
            
            {/* Right Section - User */}
            <div className="flex items-center gap-4">
              {/* User Menu */}
              <div className="relative">
                <button 
                  className="flex items-center gap-3 p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    <FaUser size={14} />
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</div>
                    <div className="text-xs text-slate-500">Administrator</div>
                  </div>
                  <FaCaretDown size={12} className="text-slate-400" />
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="text-sm font-semibold text-slate-900">{user?.name || 'Admin'}</div>
                      <div className="text-xs text-slate-500">{user?.mobile || 'admin@taaza.com'}</div>
                    </div>
                    <Link 
                      to="/admin/settings" 
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      Settings
                    </Link>
                    <button 
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="responsive-p-4 sm:responsive-p-6 lg:responsive-p-8">
            <div className="main-content min-h-screen bg-green-100">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
 
export default AdminLayout;