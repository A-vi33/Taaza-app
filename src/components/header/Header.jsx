import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Header() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItemCount, setCartItemCount] = useState(0)

  useEffect(() => {
    const savedCart = localStorage.getItem('taazaCart')
    if (savedCart) {
      const cartItems = JSON.parse(savedCart)
      setCartItemCount(cartItems.length)
    }
  }, [])

  const handleLogout = () => {
    logout()
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  // --- Styles ---
  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '1rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    width: '100%'
  }
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap'
  }
  const logoStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
  const desktopNavStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    listStyle: 'none',
    margin: 0,
    padding: 0
  }
  const mobileMenuButtonStyle = {
    display: 'none',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '0.25rem',
    transition: 'background-color 0.2s'
  }
  const mobileNavStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
    transition: 'transform 0.3s ease',
    padding: '2rem'
  }
  const mobileNavListStyle = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
    alignItems: 'center'
  }
  const mobileCloseButtonStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    padding: '0.5rem'
  }
  const navLinkStyle = {
    color: '#2c3e50',
    textDecoration: 'none',
    padding: '0.4rem 1.1rem',
    borderRadius: '20px',
    transition: 'background 0.2s, color 0.2s',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }
  const navLinkActive = { ...navLinkStyle, background: '#f8f9fa', color: '#e74c3c' }
  const mobileNavLinkStyle = {
    color: 'white',
    textDecoration: 'none',
    fontSize: '1.25rem',
    fontWeight: '500',
    padding: '1rem 2rem',
    borderRadius: '0.5rem',
    transition: 'background-color 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: '200px',
    justifyContent: 'center'
  }
  const cartBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    background: '#f8f9fa',
    border: '1px solid #ececec',
    borderRadius: '24px',
    padding: '0.5rem 1.2rem',
    fontWeight: 600,
    fontSize: '1.05rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    position: 'relative',
    transition: 'all 0.2s',
    textDecoration: 'none',
    color: '#2c3e50'
  }
  const cartCountStyle = {
    background: '#e74c3c',
    color: 'white',
    borderRadius: '50%',
    minWidth: '22px',
    height: '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: 700,
    marginLeft: '2px',
    boxShadow: '0 2px 4px rgba(231,76,60,0.18)'
  }
  const userBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#f8f9fa',
    border: '1px solid #ececec',
    borderRadius: '20px',
    padding: '0.4rem 1rem',
    fontWeight: 500,
    cursor: 'pointer',
    color: '#2c3e50',
    fontSize: '1rem',
    transition: 'all 0.2s',
    textDecoration: 'none'
  }
  const adminBtnStyle = { ...userBtnStyle, background: '#e74c3c', color: 'white', border: '1px solid #e74c3c' }

  // Responsive styles
  const responsiveStyles = {
    '@media (max-width: 768px)': {
      '.desktop-nav': { display: 'none' },
      '.mobile-menu-button': { display: 'block' },
      '.logo-text': { fontSize: '1.25rem' },
    },
    '@media (min-width: 769px)': {
      '.mobile-nav': { display: 'none' },
      '.mobile-menu-button': { display: 'none' },
    },
    '@media (max-width: 480px)': {
      '.logo-text': { fontSize: '1rem' },
      '.header-container': { padding: '0.75rem' },
    },
    '.mobile-nav-link:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
    '.nav-link:hover': { backgroundColor: '#f8f9fa', color: '#e74c3c' },
    '.cart-btn:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
    '.user-btn:hover': { backgroundColor: '#e9ecef' },
    '.admin-btn:hover': { backgroundColor: '#c0392b' },
  }

  return (
    <>
      <style>
        {`
          ${Object.entries(responsiveStyles).map(([media, styles]) => `@media (${media}) { ${styles} }`).join(' ')}
        `}
      </style>

      <header style={headerStyle}>
        <div style={containerStyle} className="header-container">
          <Link to="/" style={logoStyle}>
            <span className="logo-text">🍗 Taaza</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={desktopNavStyle}>
            {user?.type === 'customer' && (
              <>
                <Link 
                  to="/" 
                  style={location.pathname === '/' ? navLinkActive : navLinkStyle}
                  className="nav-link"
                >
                  🏠 Home
                </Link>
                <Link 
                  to="/orders" 
                  style={location.pathname === '/orders' ? navLinkActive : navLinkStyle}
                  className="nav-link"
                >
                  📋 Orders
                </Link>
                <Link 
                  to="/cart" 
                  style={cartBtnStyle}
                  className="cart-btn"
                >
                  🛒 Cart
                  {cartItemCount > 0 && (
                    <span style={cartCountStyle}>{cartItemCount}</span>
                  )}
                </Link>
              </>
            )}
            
            {user?.type === 'admin' && (
              <Link 
                to="/admin/dashboard" 
                style={adminBtnStyle}
                className="admin-btn"
              >
                👨‍💼 Admin Panel
              </Link>
            )}

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={userBtnStyle} className="user-btn">
                  👤 {user.name || user.email}
                </span>
                <button 
                  onClick={handleLogout}
                  style={{
                    ...userBtnStyle,
                    background: '#dc3545',
                    color: 'white',
                    border: '1px solid #dc3545'
                  }}
                  className="user-btn"
                >
                  🚪 Logout
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                style={userBtnStyle}
                className="user-btn"
              >
                🔐 Login
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMobileMenu}
            style={mobileMenuButtonStyle}
            className="mobile-menu-button"
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav style={mobileNavStyle} className="mobile-nav">
          <button 
            onClick={closeMobileMenu}
            style={mobileCloseButtonStyle}
            aria-label="Close mobile menu"
          >
            ✕
          </button>
          
          <ul style={mobileNavListStyle}>
            {user?.type === 'customer' && (
              <>
                <li>
                  <Link 
                    to="/" 
                    style={mobileNavLinkStyle}
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    🏠 Home
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/orders" 
                    style={mobileNavLinkStyle}
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    📋 Orders
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/cart" 
                    style={mobileNavLinkStyle}
                    className="mobile-nav-link"
                    onClick={closeMobileMenu}
                  >
                    🛒 Cart
                    {cartItemCount > 0 && (
                      <span style={cartCountStyle}>{cartItemCount}</span>
                    )}
                  </Link>
                </li>
              </>
            )}
            
            {user?.type === 'admin' && (
              <li>
                <Link 
                  to="/admin/dashboard" 
                  style={mobileNavLinkStyle}
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  👨‍💼 Admin Panel
                </Link>
              </li>
            )}

            {user ? (
              <>
                <li>
                  <span style={mobileNavLinkStyle} className="mobile-nav-link">
                    👤 {user.name || user.email}
                  </span>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      handleLogout()
                      closeMobileMenu()
                    }}
                    style={{
                      ...mobileNavLinkStyle,
                      background: '#dc3545',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    className="mobile-nav-link"
                  >
                    🚪 Logout
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link 
                  to="/login" 
                  style={mobileNavLinkStyle}
                  className="mobile-nav-link"
                  onClick={closeMobileMenu}
                >
                  🔐 Login
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>
    </>
  )
}

export default Header