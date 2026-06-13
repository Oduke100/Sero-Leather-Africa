import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout';
import Cursor from './components/Cursor';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Cursor />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
          <Route path="/products" element={<Layout><Products /></Layout>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  );
}