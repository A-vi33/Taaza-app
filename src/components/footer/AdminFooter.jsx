import React from 'react';
import { 
  FaCog, 
  FaChartLine, 
  FaUsers, 
  FaBoxes, 
  FaTruck, 
  FaClipboardList,
  FaShieldAlt,
  FaDatabase,
  FaServer,
  FaNetworkWired,
  FaLock,
  FaEye,
  FaHeart
} from 'react-icons/fa';

function AdminFooter() {
  const footerStyle = {
    background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
    color: 'white',
    padding: 'clamp(1.5rem, 3vw, 2rem) 0 clamp(0.75rem, 1.5vw, 1rem) 0',
    marginTop: '2rem',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -3px 15px rgba(0,0,0,0.15)',
    position: 'relative',
    overflow: 'hidden'
  }
  
  const contentStyle = {
    display: 'flex', 
    flexDirection: 'column',
    gap: 'clamp(1rem, 3vw, 1.5rem)', 
    padding: '0 clamp(1rem, 3vw, 2rem) clamp(0.5rem, 1.5vw, 1rem) clamp(1rem, 3vw, 2rem)',
    maxWidth: '1200px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 2
  }
  
  const sectionStyle = { 
    minWidth: '200px', 
    flex: 1, 
    marginBottom: '1rem' 
  }
  
  const titleStyle = { 
    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', 
    fontWeight: 700, 
    color: '#3498db', 
    marginBottom: 'clamp(10px, 2vw, 12px)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
  
  const textStyle = { 
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
    color: '#ecf0f1', 
    marginBottom: 'clamp(6px, 1.5vw, 8px)', 
    lineHeight: 1.5 
  }
  
  const featureStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    color: '#ecf0f1'
  }

  const bottomStyle = { 
    borderTop: '1px solid rgba(255,255,255,0.1)', 
    paddingTop: 'clamp(12px, 2vw, 16px)', 
    textAlign: 'center', 
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', 
    color: '#bdc3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  }

  const desktopLayoutStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 'clamp(1rem, 3vw, 1.5rem)'
  }

  const statsStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
    marginTop: '8px'
  }

  const statItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
    color: '#95a5a6'
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
        background: 'radial-gradient(circle at 30% 70%, rgba(52, 152, 219, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(155, 89, 182, 0.1) 0%, transparent 50%)',
        zIndex: 1
      }}></div>
      
      <div style={contentStyle}>
        {/* Mobile Layout */}
        <div className="block sm:hidden">
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaShieldAlt />
              Admin Panel
            </h3>
            <p style={textStyle}>
              Comprehensive management system for Taaza Non-Veg Market. Monitor sales, manage inventory, and oversee operations efficiently.
            </p>
            <div style={featureStyle}>
              <FaLock style={{color: '#3498db'}} />
              <span>Secure admin access</span>
            </div>
            <div style={featureStyle}>
              <FaEye style={{color: '#3498db'}} />
              <span>Real-time monitoring</span>
            </div>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaDatabase />
              System Status
            </h3>
            <div style={statsStyle}>
              <div style={statItemStyle}>
                <FaServer style={{color: '#27ae60'}} />
                <span>Server: Online</span>
              </div>
              <div style={statItemStyle}>
                <FaNetworkWired style={{color: '#27ae60'}} />
                <span>Network: Active</span>
              </div>
              <div style={statItemStyle}>
                <FaDatabase style={{color: '#27ae60'}} />
                <span>Database: Connected</span>
              </div>
              <div style={statItemStyle}>
                <FaLock style={{color: '#27ae60'}} />
                <span>Security: Protected</span>
              </div>
            </div>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaCog />
              Quick Access
            </h3>
            <div style={featureStyle}>
              <FaChartLine style={{color: '#e74c3c'}} />
              <span>Analytics Dashboard</span>
            </div>
            <div style={featureStyle}>
              <FaUsers style={{color: '#e74c3c'}} />
              <span>Employee Management</span>
            </div>
            <div style={featureStyle}>
              <FaBoxes style={{color: '#e74c3c'}} />
              <span>Product Inventory</span>
            </div>
            <div style={featureStyle}>
              <FaClipboardList style={{color: '#e74c3c'}} />
              <span>Order Management</span>
            </div>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden sm:block" style={desktopLayoutStyle}>
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaShieldAlt />
              Admin Panel
            </h3>
            <p style={textStyle}>
              Comprehensive management system for Taaza Non-Veg Market. Monitor sales, manage inventory, and oversee operations efficiently.
            </p>
            <div style={featureStyle}>
              <FaLock style={{color: '#3498db'}} />
              <span>Secure admin access</span>
            </div>
            <div style={featureStyle}>
              <FaEye style={{color: '#3498db'}} />
              <span>Real-time monitoring</span>
            </div>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaDatabase />
              System Status
            </h3>
            <div style={statsStyle}>
              <div style={statItemStyle}>
                <FaServer style={{color: '#27ae60'}} />
                <span>Server: Online</span>
              </div>
              <div style={statItemStyle}>
                <FaNetworkWired style={{color: '#27ae60'}} />
                <span>Network: Active</span>
              </div>
              <div style={statItemStyle}>
                <FaDatabase style={{color: '#27ae60'}} />
                <span>Database: Connected</span>
              </div>
              <div style={statItemStyle}>
                <FaLock style={{color: '#27ae60'}} />
                <span>Security: Protected</span>
              </div>
            </div>
          </div>
          
          <div style={sectionStyle}>
            <h3 style={titleStyle}>
              <FaCog />
              Quick Access
            </h3>
            <div style={featureStyle}>
              <FaChartLine style={{color: '#e74c3c'}} />
              <span>Analytics Dashboard</span>
            </div>
            <div style={featureStyle}>
              <FaUsers style={{color: '#e74c3c'}} />
              <span>Employee Management</span>
            </div>
            <div style={featureStyle}>
              <FaBoxes style={{color: '#e74c3c'}} />
              <span>Product Inventory</span>
            </div>
            <div style={featureStyle}>
              <FaClipboardList style={{color: '#e74c3c'}} />
              <span>Order Management</span>
            </div>
          </div>
        </div>
        
        <div style={bottomStyle}>
          <FaHeart style={{color: '#e74c3c'}} />
          © 2024 Taaza Admin Panel. Secure Management System.
        </div>
      </div>
    </footer>
  )
}

export default AdminFooter 