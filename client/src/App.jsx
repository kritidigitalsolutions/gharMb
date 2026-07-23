import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Contexts & Providers
import { ThemeProvider } from "./contexts/ThemeContexts"; 

// Layout & Protection
import AdminLayout from "./components/layout/AdminLayout"; // AdminLayout ka correct path daalein
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages imports
import DashboardHome from "./pages/DashboardHome/DashboardHome";
import PropertyVerification from "./pages/PropertyVerification/PropertyVerification";
import UserManagement from "./pages/UserManagement/UserManagement";
import BuilderManagement from "./pages/BuilderManagement/BuilderManagement";
import LeadsDashboard from "./pages/LeadsDashboard/LeadsDashboard";
import RevenueDashboard from "./pages/RevenueDashboard/RevenueDashboard";
import ReportsScreen from "./pages/ReportsScreen/ReportsScreen";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Auth/Login";
import About from "./pages/About/About";
import Legal from "./pages/Legal/Legal";


const App = () => {
  return (
    // ThemeProvider ko sabse upar rakhein taaki poore app mein theme access ho sake
    <ThemeProvider>
      <Router>
        <Routes>
          {/* 🔴 Public Route: Bina sidebar aur header ke */}
          <Route path="/login" element={<Login />} />

          {/* 🟢 Protected Routes: Ye routes AdminLayout ke andar <Outlet /> mein render honge */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            {/* 'index' ka matlab hai ki jab path '/' hoga toh default DashboardHome dikhega */}
            <Route index element={<DashboardHome />} />
            <Route path="verification" element={<PropertyVerification />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="builders" element={<BuilderManagement />} />
            <Route path="leads" element={<LeadsDashboard />} />
            <Route path="revenue" element={<RevenueDashboard />} />
            <Route path="reports" element={<ReportsScreen />} />
            <Route path="settings" element={<Settings />} />
            <Route path="about" element={<About />} />
            <Route path="legal" element={<Legal />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;