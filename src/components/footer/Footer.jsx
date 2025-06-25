import React from 'react'

function Footer() {
  const footerStyle = {
    background: '#23272f',
    color: 'white',
    padding: '2rem 0 1rem 0',
    marginTop: '3rem',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -2px 12px rgba(0,0,0,0.07)'
  }
  const contentStyle = {
    display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start',
    maxWidth: 1100, margin: '0 auto', gap: '2.5rem', padding: '0 2vw 1.5rem 2vw'
  }
  const sectionStyle = { minWidth: 220, flex: 1, marginBottom: '1rem' }
  const titleStyle = { fontSize: '1.1rem', fontWeight: 700, color: '#e74c3c', marginBottom: 10 }
  const textStyle = { fontSize: '0.97rem', color: '#e0e0e0', marginBottom: 8, lineHeight: 1.6 }
  const linkStyle = { color: '#4fc3f7', textDecoration: 'none', fontSize: '0.97rem', marginBottom: 7, display: 'block', transition: 'color 0.2s' }
  const socialStyle = { display: 'flex', gap: 16, marginTop: 8 }
  const socialIcon = { fontSize: 22, color: '#e0e0e0', transition: 'color 0.2s' }
  const bottomStyle = { borderTop: '1px solid #31343b', paddingTop: 18, textAlign: 'center', fontSize: '0.95rem', color: '#b0b0b0' }

  return (
    <footer style={footerStyle}>
      <div style={contentStyle}>
        <div style={sectionStyle}>
          <div style={titleStyle}>About Taaza</div>
          <div style={textStyle}>
            Taaza brings you the freshest, premium quality meat and seafood, delivered to your doorstep. We are committed to hygiene, taste, and customer delight.
          </div>
        </div>
        <div style={sectionStyle}>
          <div style={titleStyle}>Quick Links</div>
          <a href="/" style={linkStyle}>🏠 Home</a>
          <a href="/cart" style={linkStyle}>🛒 Cart</a>
          <a href="/orders" style={linkStyle}>📋 Orders</a>
          <a href="mailto:info@taaza.com" style={linkStyle}>✉️ Contact</a>
        </div>
        <div style={sectionStyle}>
          <div style={titleStyle}>Contact</div>
          <div style={textStyle}>✉️ info@taaza.com</div>
          <div style={textStyle}>📞 +91 1234567890</div>
          <div style={textStyle}>📍 123 Meat Street, Food City</div>
        </div>
        <div style={sectionStyle}>
          <div style={titleStyle}>Follow Us</div>
          <div style={socialStyle}>
            <a href="#" style={socialIcon} title="Facebook">📘</a>
            <a href="#" style={socialIcon} title="Twitter">🐦</a>
            <a href="#" style={socialIcon} title="Instagram">📷</a>
          </div>
        </div>
      </div>
      <div style={bottomStyle}>
        &copy; {new Date().getFullYear()} Taaza Non-Veg Market. All rights reserved.
      </div>
    </footer>
  )
}

export default Footer