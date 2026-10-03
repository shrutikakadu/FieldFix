import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import TechniciansPage from './pages/TechniciansPage';
import BookingDetailPage from './pages/BookingDetailPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SupportInboxPage from './pages/SupportInboxPage';
import CustomerDashboard from './pages/CustomerDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import { isAuthenticated, getStoredUser } from './services/auth';

// Protected Route — redirects to login if not authenticated
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;

  if (allowedRoles) {
    const user = getStoredUser();
    if (user && !allowedRoles.includes(user.role)) {
      return <RoleRedirect />;
    }
  }
  return <>{children}</>;
}

function RoleRedirect() {
  const user = getStoredUser();
  if (user?.role === 'ADMIN')      return <Navigate to="/admin/dashboard"      replace />;
  if (user?.role === 'TECHNICIAN') return <Navigate to="/technician/dashboard" replace />;
  return <Navigate to="/customer/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Pages */}
        <Route path="/"         element={<LandingPage />} />
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin Dashboard (ADMIN only) */}
        <Route path="/admin/dashboard"   element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/technicians" element={<ProtectedRoute allowedRoles={['ADMIN']}><TechniciansPage /></ProtectedRoute>} />
        <Route path="/admin/bookings/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><BookingDetailPage /></ProtectedRoute>} />
        <Route path="/admin/analytics"   element={<ProtectedRoute allowedRoles={['ADMIN']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/support"    element={<ProtectedRoute allowedRoles={['ADMIN']}><SupportInboxPage /></ProtectedRoute>} />

        {/* Customer Dashboard (CUSTOMER only) */}
        <Route path="/customer/dashboard" element={<ProtectedRoute allowedRoles={['CUSTOMER']}><CustomerDashboard /></ProtectedRoute>} />

        {/* Technician Dashboard (TECHNICIAN only) */}
        <Route path="/technician/dashboard" element={<ProtectedRoute allowedRoles={['TECHNICIAN']}><TechnicianDashboard /></ProtectedRoute>} />

        {/* Generic redirect based on role */}
        <Route path="/dashboard" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />

        {/* Catch-all → Landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
