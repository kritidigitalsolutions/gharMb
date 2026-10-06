import { Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "../components/layout/AdminLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Dashboard from '../pages/DashboardHome';
import PropertyVerification from '../pages/PropertyVerification';
import UserManagement from '../pages/UserManagement';
import BuilderManagement from '../pages/BuilderManagement';
import AgentManagement from '../pages/AgentManagement';
import LeadsDashboard from '../pages/LeadsDashboard';
import RevenueDashboard from '../pages/RevenueDashboard';
import ServicesManagement from '../pages/ServicesManagement';
import TokenBooking from '../pages/TokenBooking';
import ReferenceWorkflow from '../pages/ReferenceWorkflow';
import ReportsScreen from '../pages/ReportsScreen';
import Settings from '../pages/Settings';
import Legal from '../pages/Legal';
import About from '../pages/About';
import ContactManagement from '../pages/ContactManagement';
import AdminNotifications from '../pages/AdminNotifications';
import BroadcastManagement from '../pages/BroadcastManagement';
import InsightsManagement from '../pages/InsightsManagement';
import InsightsCategories from '../pages/InsightsCategories';
import InsightsEditor from '../pages/InsightsEditor';
import FaqManagement from '../pages/FaqManagement';
import FaqCategories from '../pages/FaqCategories';
import TestimonialManagement from '../pages/TestimonialManagement';
import WebInquiries from '../pages/WebInquiries';
import BannerManagement from '../pages/BannerManagement';

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
                <Route path="agents" element={<AgentManagement />} />
                <Route path="agent-verification" element={<Navigate to="/admin/agents" replace />} />
                <Route path="builders" element={<BuilderManagement />} />
                <Route path="leads" element={<LeadsDashboard />} />
                <Route path="services" element={<ServicesManagement />} />
                <Route path="tokens" element={<TokenBooking />} />
                <Route path="references" element={<ReferenceWorkflow />} />
                <Route path="revenue" element={<RevenueDashboard />} />
                <Route path="reports" element={<ReportsScreen />} />
                <Route path="insights" element={<InsightsManagement />} />
                <Route path="insights/categories" element={<InsightsCategories />} />
                <Route path="insights/new" element={<InsightsEditor />} />
                <Route path="insights/edit/:id" element={<InsightsEditor />} />
                <Route path="faq" element={<FaqManagement />} />
                <Route path="faq/categories" element={<FaqCategories />} />
                <Route path="faqs" element={<Navigate to="/admin/faq" replace />} />
                <Route path="faqs/categories" element={<Navigate to="/admin/faq/categories" replace />} />
                <Route path="testimonials" element={<TestimonialManagement />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="broadcasts" element={<BroadcastManagement />} />
                <Route path="broadcasts/compose" element={<Navigate to="/admin/broadcasts?tab=compose" replace />} />
                <Route path="broadcast" element={<Navigate to="/admin/broadcasts" replace />} />
                <Route path="broadcast/compose" element={<Navigate to="/admin/broadcasts?tab=compose" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="legal" element={<Legal />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<ContactManagement />} />
                <Route path="contact-us" element={<Navigate to="/admin/contact" replace />} />
                <Route path="web-inquiries" element={<WebInquiries />} />
                <Route path="banners" element={<BannerManagement />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
        </Routes>
    );
};

export default AdminRoutes;
