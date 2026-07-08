import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AgentDashboard = lazy(() => import('./pages/agent/Dashboard'));
const Clients = lazy(() => import('./pages/agent/Clients'));
const Leads = lazy(() => import('./pages/agent/Leads'));
const Contacts = lazy(() => import('./pages/agent/Contacts'));
const Deals = lazy(() => import('./pages/agent/Deals'));
const Schedules = lazy(() => import('./pages/agent/Schedules'));
const Tasks = lazy(() => import('./pages/agent/Tasks'));
const Issues = lazy(() => import('./pages/agent/Issues'));
const Sales = lazy(() => import('./pages/agent/Sales'));
const GlobalCommandCenter = lazy(() => import('./pages/superadmin/GlobalCommandCenter'));
const Notes = lazy(() => import('./pages/agent/Notes'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const Products = lazy(() => import('./pages/admin/Products'));
const Territories = lazy(() => import('./pages/admin/Territories'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const AgentProducts = lazy(() => import('./pages/agent/Products'));
const MyTerritory = lazy(() => import('./pages/agent/MyTerritory'));
const Targets = lazy(() => import('./pages/admin/Targets'));
const SuperAdminDashboardFull = lazy(() => import('./pages/superadmin/SuperAdminDashboard'));
const TenantManagement = lazy(() => import('./pages/superadmin/TenantManagement'));
const BulkOperations = lazy(() => import('./pages/admin/BulkOperations'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PredictiveAnalytics = lazy(() => import('./pages/PredictiveAnalytics'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Enterprise Features
const Intelligence = lazy(() => import('./pages/admin/Intelligence'));
const Departments = lazy(() => import('./pages/admin/Departments'));
const Goals = lazy(() => import('./pages/admin/Goals'));
const Activities = lazy(() => import('./pages/admin/Activities'));
const Branches = lazy(() => import('./pages/admin/Branches'));

// Minimal loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isDashboardRoute = ['/superadmin', '/admin', '/agent', '/dashboard'].includes(location.pathname);

  const cachedUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  if (!cachedUser) return <Navigate to="/login" replace />;

  // Superadmin can access everything
  if (cachedUser.role === 'superadmin') {
    return <Layout showHeaderActions={!isDashboardRoute}>{children}</Layout>;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(cachedUser.role)) {
    const redirectPath = cachedUser.role === 'admin' || cachedUser.role === 'manager' ? '/admin' : '/agent';
    return <Layout showHeaderActions={!isDashboardRoute}><Navigate to={redirectPath} replace /></Layout>;
  }

  return <Layout showHeaderActions={!isDashboardRoute}>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();

  const cachedUser = user || (() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  })();

  if (cachedUser) {
    if (cachedUser.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    const redirectPath = cachedUser.role === 'admin' || cachedUser.role === 'manager' ? '/admin' : '/agent';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="App min-h-screen bg-[var(--color-bg-page)]">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } />
                <Route path="/reset-password" element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } />

                {/* Super Admin Routes */}
                <Route path="/superadmin" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <SuperAdminDashboardFull />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/tenants" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <TenantManagement />
                  </ProtectedRoute>
                } />
                <Route path="/superadmin/command-center" element={
                  <ProtectedRoute allowedRoles={['superadmin']}>
                    <GlobalCommandCenter />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin/users" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/admin/reports" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="/admin/products" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/admin/territories" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Territories />
                  </ProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/admin/settings" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/admin/bulk-operations" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'superadmin']}>
                    <BulkOperations />
                  </ProtectedRoute>
                } />
                <Route path="/admin/targets" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Targets />
                  </ProtectedRoute>
                } />
                <Route path="/admin/intelligence" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Intelligence />
                  </ProtectedRoute>
                } />
                <Route path="/admin/departments" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Departments />
                  </ProtectedRoute>
                } />
                <Route path="/admin/goals" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Goals />
                  </ProtectedRoute>
                } />
                <Route path="/admin/activities" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Activities />
                  </ProtectedRoute>
                } />
                <Route path="/admin/branches" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Branches />
                  </ProtectedRoute>
                } />

                {/* Agent Routes */}
                <Route path="/change-password" element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                } />
                <Route path="/agent" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/agent/clients" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Clients />
                  </ProtectedRoute>
                } />
                <Route path="/agent/leads" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Leads />
                  </ProtectedRoute>
                } />
                <Route path="/agent/contacts" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Contacts />
                  </ProtectedRoute>
                } />
                <Route path="/agent/deals" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Deals />
                  </ProtectedRoute>
                } />
                <Route path="/agent/schedules" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Schedules />
                  </ProtectedRoute>
                } />
                <Route path="/agent/sales" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Sales />
                  </ProtectedRoute>
                } />
                <Route path="/agent/tasks" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <Tasks />
                  </ProtectedRoute>
                } />
<Route path="/agent/issues" element={
                   <ProtectedRoute allowedRoles={['agent']}>
                     <Issues />
                   </ProtectedRoute>
                 } />
                 <Route path="/agent/notes" element={
                   <ProtectedRoute allowedRoles={['agent']}>
                     <Notes />
                   </ProtectedRoute>
                 } />
                <Route path="/agent/products" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <AgentProducts />
                  </ProtectedRoute>
                } />
                <Route path="/agent/my-territory" element={
                  <ProtectedRoute allowedRoles={['agent']}>
                    <MyTerritory />
                  </ProtectedRoute>
                } />

                {/* Dashboard Route - Available to all authenticated users */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />

                {/* Predictive Analytics Route - Available to admin and manager */}
                <Route path="/predictive-analytics" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <PredictiveAnalytics />
                  </ProtectedRoute>
                } />

                <Route path="/" element={
                  <PublicRoute>
                    <LandingPage />
                  </PublicRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#fff',
                  color: '#333',
                },
                success: {
                  iconTheme: {
                     primary: '#FFD700',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
