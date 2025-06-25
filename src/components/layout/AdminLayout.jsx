import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaDrumstickBite, FaUsersCog, FaClipboardList, FaTruck, FaCog, FaChartBar, FaChevronLeft, FaChevronRight, FaSignOutAlt } from 'react-icons/fa';
 
const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { to: '/admin/transaction', label: 'Transaction', icon: <FaTachometerAlt />},
  { to: '/admin/products', label: 'Products', icon: <FaDrumstickBite /> },
  { to: '/admin/employees', label: 'Employees', icon: <FaUsersCog /> },
  { to: '/admin/orders', label: 'Orders', icon: <FaClipboardList /> },
  { to: '/admin/delivery', label: 'Delivery', icon: <FaTruck /> },
  { to: '/admin/analytics', label: 'Analytics', icon: <FaChartBar /> },
  { to: '/admin/settings', label: 'Settings', icon: <FaCog /> },
];
 
function AdminLayout({ children }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className={`bg-white shadow-lg flex flex-col py-8 px-2 transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'}`}>
        <div className={`flex items-center justify-between mb-8 ${collapsed ? 'px-0' : 'px-2'}`}>
          <span className={`text-2xl font-bold text-green-700 transition-all duration-200 ${collapsed ? 'hidden' : 'block'}`}>Tazza Admin</span>
          <button onClick={() => setCollapsed(c => !c)} className="p-2 rounded hover:bg-gray-200">
            {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        </div>
        <nav className="flex-1">
          {adminLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-2 py-3 rounded-lg mb-2 text-lg font-medium transition-colors ${location.pathname.startsWith(link.to) ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-green-50'} ${collapsed ? 'justify-center' : ''}`}
              title={link.label}
            >
              <span className="text-xl">{link.icon}</span> {!collapsed && link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-center">
          <Link to="/login" className="flex items-center justify-center gap-2 text-red-600 font-semibold">
            <FaSignOutAlt /> {!collapsed && 'Logout'}
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
}
 
export default AdminLayout;