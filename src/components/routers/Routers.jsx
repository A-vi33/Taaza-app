import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/user/Home'
import Cart from '../pages/user/Cart'
import Orders from '../pages/user/Orders'
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminTransaction from '../pages/admin/AdminTransaction'
import AdminProducts from '../pages/admin/AdminProducts'
import AdminEmployees from '../pages/admin/AdminEmployees'
import OrderConfirmation from '../pages/user/OrderConfirmation'
import SimpleLogin from '../pages/user/SimpleLogin'
import AdminLayout from '../layout/AdminLayout'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminDelivery from '../pages/admin/AdminDelivery'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminSettings from '../pages/admin/AdminSettings'
 
 
function Routers() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/cart' element={<Cart/>}/>
      <Route path='/orders' element={<Orders/>}/>
      <Route path='/login' element={<SimpleLogin/>}/>
      <Route path='/order-confirmation' element={<OrderConfirmation/>}/>
      <Route path='/admin' element={<AdminLayout />}>
        <Route path='dashboard' element={<AdminDashboard />} />
        <Route path='transaction' element={<AdminTransaction />} />
        <Route path='products' element={<AdminProducts />} />
        <Route path='employees' element={<AdminEmployees />} />
        <Route path='orders' element={<AdminOrders />} />
        <Route path='delivery' element={<AdminDelivery />} />
        <Route path='analytics' element={<AdminAnalytics />} />
        <Route path='settings' element={<AdminSettings />} />
      </Route>
    </Routes>
  )
}
 
export default Routers
 