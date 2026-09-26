import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/common/ScrollToTop';

import Home from './pages/Home/Home';
import Blog from './pages/Blog/Blog';
import BlogDetail from './pages/BlogDetail/BlogDetail';
import LegalPolicy from './pages/Legal/LegalPolicy';
import DeleteProfile from './pages/Legal/DeleteProfile';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/insights" element={<Blog />} />
            <Route path="/insights/:slug" element={<BlogDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/privacy-policy" element={<LegalPolicy type="privacy-policy" />} />
            <Route path="/terms-of-service" element={<LegalPolicy type="terms" />} />
            <Route path="/delete-profile" element={<DeleteProfile />} />
            <Route path="/delete-account" element={<DeleteProfile />} />
            <Route path="/account-deletion" element={<DeleteProfile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
