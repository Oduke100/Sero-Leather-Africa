import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CurrencyProvider } from './context/CurrencyContext';
import Layout from './components/Layout';
import Cursor from './components/Cursor';
import Home from './pages/Home';
import ComingSoon from './pages/ComingSoon';

export default function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <Cursor />
        <Routes>
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/coming-soon" element={<ComingSoon />} />
          <Route path="*" element={<ComingSoon />} />
        </Routes>
      </BrowserRouter>
    </CurrencyProvider>
  );
}