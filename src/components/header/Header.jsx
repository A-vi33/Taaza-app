import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Header() {
  const { user, setUser } = useAuth()
  const [cartCount, setCartCount] = useState(0)
  const navigate = useNavigate()

  // Load cart data from localStorage and update count
  useEffect(() => {
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('taazaCart')
      if (savedCart) {
        const cartItems = JSON.parse(savedCart)
        const totalCount = cartItems.reduce((total, item) => total + item.quantity, 0)
        setCartCount(totalCount)
      } else {
        setCartCount(0)
      }
    }

    // Update count on mount
    updateCartCount()

    // Listen for storage changes (when cart is updated from other components)
    const handleStorageChange = () => {
      updateCartCount()
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(updateCartCount, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

  const handleCartClick = () => {
    navigate('/cart')
  }

  const handleLogout = () => {
    setUser(null) // TODO: Add Firebase signOut
    navigate('/login')
  }

  // --- Styles ---
  const headerStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2.5vw', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
    borderBottom: '1px solid #ececec', position: 'sticky', top: 0, zIndex: 1000
  }
  const logoStyle = {
    display: 'flex', alignItems: 'center', gap: 8, fontSize: '2rem', fontWeight: 700,
    color: '#e74c3c', textDecoration: 'none', letterSpacing: 1
  }
  const navStyle = {
    display: 'flex', alignItems: 'center', gap: '1.5rem',
    fontSize: '1.05rem', fontWeight: 500
  }
  const navLinkStyle = {
    color: '#2c3e50', textDecoration: 'none', padding: '0.4rem 1.1rem', borderRadius: 20,
    transition: 'background 0.2s, color 0.2s', fontWeight: 500
  }
  const navLinkActive = { ...navLinkStyle, background: '#f8f9fa', color: '#e74c3c' }
  const cartBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
    background: '#f8f9fa', border: '1px solid #ececec', borderRadius: 24,
    padding: '0.5rem 1.2rem', fontWeight: 600, fontSize: '1.05rem',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', position: 'relative', transition: 'all 0.2s'
  }
  const cartCountStyle = {
    background: '#e74c3c', color: 'white', borderRadius: '50%', minWidth: 22, height: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
    marginLeft: 2, boxShadow: '0 2px 4px rgba(231,76,60,0.18)'
  }
  const userBtnStyle = {
    display: 'flex', alignItems: 'center', gap: 6, background: '#f8f9fa',
    border: '1px solid #ececec', borderRadius: 20, padding: '0.4rem 1rem',
    fontWeight: 500, cursor: 'pointer', color: '#2c3e50', fontSize: '1rem', transition: 'all 0.2s'
  }

  return (
    <header style={headerStyle}>
      {/* Logo */}
      <Link to="/" style={logoStyle}>
        <span role="img" aria-label="logo">🍗</span> Taaza
      </Link>

      {/* Navigation */}
      <nav style={navStyle}>
        <Link to="/" style={navLinkStyle}>Home</Link>
        <Link to="/orders" style={navLinkStyle}>Orders</Link>
        <a href="mailto:info@taaza.com" style={navLinkStyle}>Contact</a>
      </nav>

      {/* Right: Cart and User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={cartBtnStyle} onClick={handleCartClick} title="View Cart">
          <span role="img" aria-label="cart">🛒</span>
          <span>Cart</span>
          <span style={cartCountStyle}>{cartCount}</span>
        </div>
        {user ? (
          <>
            <button style={userBtnStyle} onClick={handleLogout} title="Logout">
              <span role="img" aria-label="user">👤</span>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" style={userBtnStyle} title="Login">
            <span role="img" aria-label="login">🔑</span>
            Login
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header