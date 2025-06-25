import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Cart from '../pages/Cart'
import Orders from '../pages/Orders'
import AdminDashboard from '../pages/AdminDashboard'
import AdminTransaction from '../pages/AdminTransaction'
import AdminProducts from '../pages/AdminProducts'
import AdminEmployees from '../pages/AdminEmployees'
import CustomerRegister from '../pages/CustomerRegister'
import OrderConfirmation from '../pages/OrderConfirmation'
import CommonLogin from '../pages/CommonLogin'
import AdminLayout from '../layout/AdminLayout'
import AdminOrders from '../pages/AdminOrders'
import AdminDelivery from '../pages/AdminDelivery'
import AdminAnalytics from '../pages/AdminAnalytics'
import AdminSettings from '../pages/AdminSettings'
 
 
function Routers() {
  return (
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/cart' element={<Cart/>}/>
      <Route path='/orders' element={<Orders/>}/>
      <Route path='/login' element={<CommonLogin/>}/>
      <Route path='/register' element={<CustomerRegister/>}/>
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
 