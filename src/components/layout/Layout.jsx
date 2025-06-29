import React from 'react'
import Header from '../header/Header'
import Footer from '../footer/Footer'
import Routers from '../routers/Routers'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Layout() {
  function HideHeaderFooterWrapper({ children }) {
    const location = useLocation();
    const { loading } = useAuth();
    const hideHeaderFooter = [
      '/login'
    ].some(path => location.pathname.startsWith(path));
    
    // Check if it's an admin page
    const isAdminPage = location.pathname.startsWith('/admin');
    
    // Show loading screen while authentication is being initialized
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-green-800">Loading...</p>
            <p className="text-sm text-green-600 mt-2">Initializing your session</p>
          </div>
        </div>
      );
    }
    
    // For admin pages, render without the standard layout wrapper
    if (isAdminPage) {
      return (
        <div className="admin-layout min-h-screen flex flex-col">
          <div className="flex-1">
            {children}
          </div>
        </div>
      );
    }
    
    // For user pages, use the standard layout with improved responsive design
    return (
      <div className="user-layout min-h-screen flex flex-col">
        {!hideHeaderFooter && (
          <div className="header-container flex-shrink-0">
            <Header />
          </div>
        )}
        <main className="main-content flex-1 flex flex-col min-h-0">
          <div className="content-wrapper flex-1">
            {children}
          </div>
        </main>
        {!hideHeaderFooter && (
          <div className="footer-container flex-shrink-0">
            <Footer />
          </div>
        )}
      </div>
    );
  }

  return (
    <Router>
      <HideHeaderFooterWrapper>
        <Routers />
      </HideHeaderFooterWrapper>
    </Router>
  )
}

export default Layout