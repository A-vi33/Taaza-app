import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaFacebook, 
  FaInstagram, 
  FaTwitter, 
  FaYoutube,
  FaHeart,
  FaShieldAlt,
  FaTruck,
  FaClock
} from 'react-icons/fa';

function Footer() {
  const footerStyle = {
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    color: 'white',
    padding: 'clamp(2rem, 4vw, 3rem) 0 clamp(1rem, 2vw, 1.5rem) 0',
    marginTop: '3rem',
    borderRadius: '20px 20px 0 0',
    boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
    position: 'relative',
    overflow: 'hidden'
  }
  
  const contentStyle = {
    display: 'flex', 
    flexDirection: 'column',
    gap: 'clamp(1.5rem, 4vw, 2.5rem)', 
    padding: '0 clamp(1rem, 3vw, 2rem) clamp(0.75rem, 2vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2
  }
  
  const sectionStyle = { 
    minWidth: '220px', 
    flex: 1, 
    marginBottom: '1rem' 
  }
  
  const titleStyle = { 
    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', 
    fontWeight: 700, 
    color: '#ffd700', 
    marginBottom: 'clamp(12px, 2vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
  
  const textStyle = { 
    fontSize: 'clamp(0.875rem, 2vw, 0.97rem)', 
    color: '#e8f4fd', 
    marginBottom: 'clamp(8px, 1.5vw, 10px)', 
    lineHeight: 1.6 
  }
  
  const linkStyle = { 
    color: '#87ceeb', 
    textDecoration: 'none', 
    fontSize: 'clamp(0.875rem, 2vw, 0.97rem)', 
    marginBottom: 'clamp(8px, 1.5vw, 10px)', 
    display: 'flex', 
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    padding: '4px 0'
  }
  
  const socialStyle = { 
    display: 'flex', 
    gap: 'clamp(12px, 3vw, 16px)', 
    marginTop: 'clamp(8px, 1.5vw, 12px)' 
  }
  
  const socialIcon = { 
    fontSize: 'clamp(20px, 4vw, 24px)', 
    color: '#e8f4fd', 
    transition: 'all 0.3s ease',
    padding: '8px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
  
  const bottomStyle = { 
    borderTop: '1px solid rgba(255,255,255,0.2)', 
    paddingTop: 'clamp(16px, 3vw, 20px)', 
    textAlign: 'center', 
    fontSize: 'clamp(0.875rem, 2vw, 0.95rem)', 
    color: '#b0c4de',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }

  const featureStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: 'clamp(0.875rem, 2vw, 0.97rem)',
    color: '#e8f4fd'
  }

  return (
    <footer style={footerStyle}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
        zIndex: 1
      }}></div>
      
      <div style={contentStyle}>
        {/* Single Responsive Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(1.5rem, 4vw, 2.5rem)',
          width: '100%'
        }}>
          {/* About Section */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaShieldAlt />
              About Taaza
            </h3>
            <p style={textStyle}>
              Premium fresh meat and fish delivered to your doorstep. We ensure the highest quality products with competitive prices and exceptional service.
            </p>
            <div style={featureStyle}>
              <FaTruck style={{color: '#ffd700'}} />
              <span>Free Delivery on orders above ₹500</span>
            </div>
            <div style={featureStyle}>
              <FaClock style={{color: '#ffd700'}} />
              <span>Same day delivery available</span>
            </div>
          </div>
          
          {/* Contact Section */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaEnvelope />
              Contact Info
            </h3>
            <div style={featureStyle}>
              <FaPhone style={{color: '#87ceeb'}} />
              <span>+91 98765 43210</span>
            </div>
            <div style={featureStyle}>
              <FaEnvelope style={{color: '#87ceeb'}} />
              <span>info@taaza.com</span>
            </div>
            <div style={featureStyle}>
              <FaMapMarkerAlt style={{color: '#87ceeb'}} />
              <span>123 Main Street, City, State</span>
            </div>
          </div>
          
          {/* Social Section */}
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaHeart />
              Follow Us
            </h3>
            <div style={socialStyle}>
              <a href="#" style={socialIcon} onMouseOver={(e) => {e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'translateY(-2px)'}} onMouseOut={(e) => {e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.transform = 'translateY(0)'}}>
                <FaFacebook />
              </a>
              <a href="#" style={socialIcon} onMouseOver={(e) => {e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'translateY(-2px)'}} onMouseOut={(e) => {e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.transform = 'translateY(0)'}}>
                <FaInstagram />
              </a>
              <a href="#" style={socialIcon} onMouseOver={(e) => {e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'translateY(-2px)'}} onMouseOut={(e) => {e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.transform = 'translateY(0)'}}>
                <FaTwitter />
              </a>
              <a href="#" style={socialIcon} onMouseOver={(e) => {e.target.style.background = 'rgba(255,255,255,0.2)'; e.target.style.transform = 'translateY(-2px)'}} onMouseOut={(e) => {e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.transform = 'translateY(0)'}}>
                <FaYoutube />
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Copyright */}
        <div style={bottomStyle}>
          <FaHeart style={{color: '#ff6b6b'}} />
          © 2024 Taaza Non-Veg Market. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer