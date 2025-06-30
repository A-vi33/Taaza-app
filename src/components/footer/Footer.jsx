import React from 'react';
// Link is not used, so it can be removed for cleaner code
// import { Link } from 'react-router-dom';
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
  return (
    <footer 
      className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white py-12 sm:py-16 mt-12 rounded-t-2xl shadow-2xl shadow-slate-300 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,119,198,0.3)_0%,_transparent_50%),_radial-gradient(circle_at_80%_20%,_rgba(255,119,198,0.3)_0%,_transparent_50%)] z-0"
      ></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* --- Main Content: Single Responsive Layout --- */}
        {/* This container is a column on mobile and a row on screens sm and larger */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-between gap-10 sm:gap-8 mb-10">

          {/* Section 1: About Taaza - HIDDEN ON MOBILE */}
          {/* 👇 MODIFIED HERE: Added 'hidden sm:block' */}
          <div className="hidden sm:block flex-1 min-w-[220px]">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <FaShieldAlt />
              About Taaza
            </h3>
            <p className="text-sm text-blue-100 mb-3 leading-relaxed">
              Premium fresh meat and fish delivered to your doorstep. We ensure the highest quality products with competitive prices and exceptional service.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-100 mb-1">
              <FaTruck className="text-yellow-400" />
              <span>Free Delivery on orders above ₹500</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-100">
              <FaClock className="text-yellow-400" />
              <span>Same day delivery available</span>
            </div>
          </div>
          
          {/* Section 2: Contact Info - ALWAYS VISIBLE */}
          <div className="flex-1 min-w-[220px]">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <FaEnvelope />
              Contact Info
            </h3>
            <div className="flex items-center gap-2 text-sm text-sky-300 mb-2">
              <FaPhone />
              <span>‪+91 98765 43210‬</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sky-300 mb-2">
              <FaEnvelope />
              <span>info@taaza.com</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sky-300">
              <FaMapMarkerAlt />
              <span>123 Main Street, City, State</span>
            </div>
          </div>
          
          {/* Section 3: Follow Us - HIDDEN ON MOBILE */}
          {/* 👇 MODIFIED HERE: Added 'hidden sm:block' */}
          <div className="hidden sm:block flex-1 min-w-[220px]">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <FaHeart />
              Follow Us
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="p-2 rounded-full bg-white/10 text-blue-100 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
                <FaFacebook size={20} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 text-blue-100 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
                <FaInstagram size={20} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 text-blue-100 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
                <FaTwitter size={20} />
              </a>
              <a href="#" className="p-2 rounded-full bg-white/10 text-blue-100 hover:bg-white/20 hover:-translate-y-1 transition-all duration-300">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="border-t border-white/20 pt-6 text-sm text-blue-200 flex items-center justify-center gap-2">
          <FaHeart className="text-red-400" />
          <span>© {new Date().getFullYear()} Taaza Non-Veg Market. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;