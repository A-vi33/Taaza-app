import React from 'react'

function Footer() {
  const footerStyle = {
    background: '#23272f',
    color: 'white',
    padding: 'clamp(1rem, 3vw, 2rem) 0 clamp(0.5rem, 2vw, 1rem) 0',
    marginTop: '3rem',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.07)'
  }
  
  const contentStyle = {
    display: 'flex', 
    flexDirection: 'column',
    gap: 'clamp(1.5rem, 4vw, 2.5rem)', 
    padding: '0 clamp(1rem, 3vw, 2rem) clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
    maxWidth: '1200px',
    margin: '0 auto'
  }
  
  const sectionStyle = { 
    minWidth: '220px', 
    flex: 1, 
    marginBottom: '1rem' 
  }
  
  const titleStyle = { 
    fontSize: 'clamp(1rem, 2.5vw, 1.1rem)', 
    fontWeight: 700, 
    color: '#e74c3c', 
    marginBottom: 'clamp(8px, 2vw, 10px)' 
  }
  
  const textStyle = { 
    fontSize: 'clamp(0.875rem, 2vw, 0.97rem)', 
    color: '#e0e0e0', 
    marginBottom: 'clamp(6px, 1.5vw, 8px)', 
    lineHeight: 1.6 
  }
  
  const linkStyle = { 
    color: '#4fc3f7', 
    textDecoration: 'none', 
    fontSize: 'clamp(0.875rem, 2vw, 0.97rem)', 
    marginBottom: 'clamp(5px, 1.5vw, 7px)', 
    display: 'block', 
    transition: 'color 0.2s' 
  }
  
  const socialStyle = { 
    display: 'flex', 
    gap: 'clamp(12px, 3vw, 16px)', 
    marginTop: 'clamp(6px, 1.5vw, 8px)' 
  }
  
  const socialIcon = { 
    fontSize: 'clamp(18px, 4vw, 22px)', 
    color: '#e0e0e0', 
    transition: 'color 0.2s' 
  }
  
  const bottomStyle = { 
    borderTop: '1px solid #31343b', 
    paddingTop: 'clamp(12px, 3vw, 18px)', 
    textAlign: 'center', 
    fontSize: 'clamp(0.875rem, 2vw, 0.95rem)', 
    color: '#b0b0b0' 
  }

  const desktopLayoutStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'clamp(1.5rem, 4vw, 2.5rem)'
  }

  return (
    <footer style={footerStyle}>
      <div style={contentStyle}>
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div style={sectionStyle}>
            <h3 style={titleStyle}>About Taaza</h3>
            <p style={textStyle}>
              Fresh meat and fish delivered to your doorstep. Quality products, competitive prices, and excellent service.
            </p>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Quick Links</h3>
            <a href="/" style={linkStyle}>Home</a>
            <a href="/cart" style={linkStyle}>Cart</a>
            <a href="/orders" style={linkStyle}>Orders</a>
            <a href="/login" style={linkStyle}>Login</a>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Contact Info</h3>
            <p style={textStyle}>📞 +91 98765 43210</p>
            <p style={textStyle}>📧 info@taaza.com</p>
            <p style={textStyle}>📍 123 Main Street, City, State</p>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Follow Us</h3>
            <div style={socialStyle}>
              <a href="#" style={socialIcon}>📘</a>
              <a href="#" style={socialIcon}>📷</a>
              <a href="#" style={socialIcon}>🐦</a>
              <a href="#" style={socialIcon}>📺</a>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block" style={desktopLayoutStyle}>
          <div style={sectionStyle}>
            <h3 style={titleStyle}>About Taaza</h3>
            <p style={textStyle}>
              Fresh meat and fish delivered to your doorstep. Quality products, competitive prices, and excellent service.
            </p>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Quick Links</h3>
            <a href="/" style={linkStyle}>Home</a>
            <a href="/cart" style={linkStyle}>Cart</a>
            <a href="/orders" style={linkStyle}>Orders</a>
            <a href="/login" style={linkStyle}>Login</a>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Contact Info</h3>
            <p style={textStyle}>📞 +91 98765 43210</p>
            <p style={textStyle}>📧 info@taaza.com</p>
            <p style={textStyle}>📍 123 Main Street, City, State</p>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>Follow Us</h3>
            <div style={socialStyle}>
              <a href="#" style={socialIcon}>📘</a>
              <a href="#" style={socialIcon}>📷</a>
              <a href="#" style={socialIcon}>🐦</a>
              <a href="#" style={socialIcon}>📺</a>
            </div>
          </div>
        </div>
        
        <div style={bottomStyle}>
          © 2024 Taaza Non-Veg Market. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer