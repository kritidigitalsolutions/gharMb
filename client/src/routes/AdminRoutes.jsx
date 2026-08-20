import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Dashboard from '../pages/DashboardHome';
import PropertyVerification from '../pages/PropertyVerification';
import UserManagement from '../pages/UserManagement';
import BuilderManagement from '../pages/BuilderManagement';
import LeadsDashboard from '../pages/LeadsDashboard';
import RevenueDashboard from '../pages/RevenueDashboard';
import ServicesManagement from '../pages/ServicesManagement';
import TokenBooking from '../pages/TokenBooking';
import ReferenceWorkflow from '../pages/ReferenceWorkflow';
import ReportsScreen from '../pages/ReportsScreen';
import Settings from '../pages/Settings';
import Legal from '../pages/Legal';
import About from '../pages/About';
import AdminNotifications from '../pages/AdminNotifications';

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={
                <ProtectedRoute>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="verification" element={<PropertyVerification />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="builders" element={<BuilderManagement />} />
                <Route path="leads" element={<LeadsDashboard />} />
                <Route path="services" element={<ServicesManagement />} />
                <Route path="tokens" element={<TokenBooking />} />
                <Route path="references" element={<ReferenceWorkflow />} />
                <Route path="revenue" element={<RevenueDashboard />} />
                <Route path="reports" element={<ReportsScreen />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="legal" element={<Legal />} />
                <Route path="about" element={<About />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
