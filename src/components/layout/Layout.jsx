import React from 'react'
import Header from '../header/Header'
import Footer from '../footer/Footer'
import Routers from '../routers/Routers'
import { BrowserRouter as Router, useLocation } from 'react-router-dom'

function Layout() {
  function HideHeaderFooterWrapper({ children }) {
    const location = useLocation();
    const hideHeaderFooter = [
      '/login'
    ].some(path => location.pathname.startsWith(path));
    return (
      <div className="page-container">
        {!hideHeaderFooter && <Header />}
        <main className="main-content">
          {children}
        </main>
        {!hideHeaderFooter && <Footer />}
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