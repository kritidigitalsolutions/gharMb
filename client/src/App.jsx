import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';

// Pages imports
import AdminLogin from './pages/AdminLogin';
import DashboardHome from './pages/DashboardHome';
import PropertyVerification from './pages/PropertyVerification';
import UserManagement from './pages/UserManagement';
import BuilderManagement from './pages/BuilderManagement';
import LeadsDashboard from './pages/LeadsDashboard';
import RevenueDashboard from './pages/RevenueDashboard';
import ReportsScreen from './pages/ReportsScreen';
import Settings from './pages/Settings';
import Legal from './pages/Legal/Legal';
import About from './pages/About/About';
import AdminNotifications from './pages/AdminNotifications';

const LayoutWrapper = ({ children, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // If on login page, render full screen login page without sidebar & header
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Dynamic header title matching routes
  const getHeaderTitle = (pathname) => {
    switch (pathname) {
      case '/': return 'Dashboard Analytics';
      case '/verification': return 'Property Verification Pipeline';
      case '/users': return 'Platform User Management';
      case '/builders': return 'Builder RERA Certifications';
      case '/leads': return 'Leads & Enquiries Dashboard';
      case '/revenue': return 'Revenue & Escrow Tokens';
      case '/reports': return 'Reports & Analytics Center';
      case '/notifications': return 'System Notifications & Broadcast';
      case '/settings': return 'System Configurations';
      case '/legal': return 'Legal & Compliance Policies';
      case '/about': return 'About Platform';
      default: return 'Gharmb Admin';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Collapsible Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        onLogout={onLogout} 
      />

      {/* Main panel */}
      <div className={`flex flex-col flex-1 overflow-hidden transition-[padding-left] duration-200 ease-in-out ${
        isCollapsed ? 'md:pl-20' : 'md:pl-64'
      }`}>
        {/* Header bar */}
        <Header toggleSidebar={toggleSidebar} title={getHeaderTitle(location.pathname)} />

        {/* Content body view */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  // eslint-disable-next-line no-unused-vars
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem('adminUser');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    setAdminUser(null);
  };

  return (
    <Router>
      <LayoutWrapper onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={<AdminLogin onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/" element={<DashboardHome />} />
          <Route path="/verification" element={<PropertyVerification />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/builders" element={<BuilderManagement />} />
          <Route path="/leads" element={<LeadsDashboard />} />
          <Route path="/revenue" element={<RevenueDashboard />} />
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/notifications" element={<AdminNotifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
};

export default App;
