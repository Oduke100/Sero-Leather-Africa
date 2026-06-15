import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import { CartProvider } from './context/CartContext';
import { HeroSliderProvider } from './context/HeroSliderContext';
import Checkout from './pages/Checkout';
import Cart from './pages/Cart';
import OrderConfirmation from './pages/OrderConfirmation';
import Layout from './components/Layout';
import Cursor from './components/Cursor';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';
import ProductDetail from './pages/ProductDetail';
import CollectionDetail from './pages/CollectionDetail';
import About from './pages/About';
import Collections from './pages/Collections';
import PayPalReturn from './pages/PayPalReturn';
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

export default function App() {
  return (
    <HeroSliderProvider>
    <CurrencyProvider>
      <CartProvider>
      <BrowserRouter>
        <Cursor />
        <Suspense fallback={<div style={{background:"var(--midnight)",minHeight:"100vh"}}/>}>
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/collections/:slug" element={<Layout><CollectionDetail /></Layout>} />
          <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/collections" element={<Layout><Collections /></Layout>} />
          <Route path="/products" element={<Layout><Collections /></Layout>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/about" element={<Layout><About /></Layout>} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="/cart" element={<Layout><Cart /></Layout>} />
          <Route path="/checkout" element={<Layout><Checkout /></Layout>} />
          <Route path="/checkout/paypal-return" element={<Layout><PayPalReturn /></Layout>} />
          <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </CartProvider>
    </CurrencyProvider>
    </HeroSliderProvider>
  );
}