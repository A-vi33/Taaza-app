import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { FaHome, FaClipboardList, FaShoppingCart, FaUser, FaSignOutAlt, FaBars, FaTimes, FaUserCog } from 'react-icons/fa'

function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const savedCart = localStorage.getItem('taazaCart')
    if (savedCart) {
      const cartItems = JSON.parse(savedCart)
      setCartItemCount(cartItems.length)
    }
  }, [])

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    // Cleanup function to reset scroll on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    // We wrap the component in a React Fragment to place the mobile menu outside the header's stacking context
    <>
      <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                🍗
              </div>
              <span className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors">
                Taaza
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {user?.type === 'customer' && (
                <>
                  <Link 
                    to="/" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === '/' 
                        ? 'bg-slate-100 text-slate-800 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <FaHome size={16} />
                    <span>Home</span>
                  </Link>
                  
                  <Link 
                    to="/orders" 
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === '/orders' 
                        ? 'bg-slate-100 text-slate-800 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <FaClipboardList size={16} />
                    <span>Orders</span>
                  </Link>

                  <Link 
                    to="/cart" 
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all duration-200 relative"
                  >
                    <FaShoppingCart size={16} />
                    <span>Cart</span>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartItemCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {user?.type === 'admin' && !location.pathname.startsWith('/admin') && (
                <Link 
                  to="/admin/dashboard" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 shadow-sm"
                >
                  <FaUserCog size={16} />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {user ? (
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      <FaUser size={12} />
                    </div>
                    <span className="hidden sm:block">{user.name || 'User'}</span>
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <div className="text-sm font-semibold text-slate-900">{user.name || 'User'}</div>
                        <div className="text-xs text-slate-500">{user.mobile || 'user@taaza.com'}</div>
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt size={14} />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/login" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 text-white hover:bg-slate-700 transition-all duration-200 shadow-sm"
                >
                  <FaUser size={14} />
                  <span>Login</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button 
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                aria-label="Toggle mobile menu"
              >
                <FaBars size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* NEW MOBILE NAVIGATION - SLIDING PANEL */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={closeMobileMenu}
        ></div>

        {/* Sliding Menu Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-4/5 max-w-xs bg-white shadow-xl transition-transform duration-300 ease-in-out flex flex-col
                      ${isMobileMenuOpen ? 'transform translate-x-0' : 'transform translate-x-full'}`}
        >
          {/* Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <span className="font-bold text-lg text-slate-700">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <FaTimes size={20} />
            </button>
          </div>

          {/* Menu Links (copied from original mobile menu) */}
          <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
            {user?.type === 'customer' && (
              <>
                <Link
                  to="/"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === '/'
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <FaHome size={18} />
                  <span>Home</span>
                </Link>
               
                <Link
                  to="/orders"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    location.pathname === '/orders'
                      ? 'bg-slate-100 text-slate-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                  onClick={closeMobileMenu}
                >
                  <FaClipboardList size={18} />
                  <span>Orders</span>
                </Link>
               
                <Link
                  to="/cart"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors relative"
                  onClick={closeMobileMenu}
                >
                  <FaShoppingCart size={18} />
                  <span>Cart</span>
                  {cartItemCount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
              </>
            )}
           
            {user?.type === 'admin' && !location.pathname.startsWith('/admin') && (
              <Link
                to="/admin/dashboard"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-base font-medium bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                onClick={closeMobileMenu}
              >
                <FaUserCog size={18} />
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>

          {/* Menu Footer (User Info & Logout) */}
          {user && (
            <div className="p-4 border-t border-slate-200">
               <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white">
                    <FaUser size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{user.name || 'User'}</div>
                    <div className="text-sm text-slate-500">{user.mobile || 'user@taaza.com'}</div>
                  </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  closeMobileMenu();
                }}
                className="w-full flex items-center justify-center space-x-3 px-3 py-2 rounded-lg text-base font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
              >
                <FaSignOutAlt size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Header