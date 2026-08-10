import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'react-hot-toast';

import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/Layout/AppLayout';
import DoctorLayout from './components/Layout/DoctorLayout';
import AdminLayout from './components/Layout/AdminLayout';
import PageSkeleton from './components/PageSkeleton';

// ── Critical path: always loaded (auth + layout) ─────────────────────────────
import AuthPage from './pages/AuthPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

// ── Patient pages — lazy loaded ───────────────────────────────────────────────
const Dashboard           = lazy(() => import('./pages/Dashboard'));
const Medications         = lazy(() => import('./pages/Medications'));
const DoseLog             = lazy(() => import('./pages/DoseLog'));
const Members             = lazy(() => import('./pages/Members'));
const HealthLog           = lazy(() => import('./pages/HealthLog'));
const RefillAlerts        = lazy(() => import('./pages/RefillAlerts'));
const Reminders           = lazy(() => import('./pages/Reminders'));
const Appointments        = lazy(() => import('./pages/Appointments'));
const Adherence           = lazy(() => import('./pages/Adherence'));
const HealthTimeline      = lazy(() => import('./pages/HealthTimeline'));
const HealthVault         = lazy(() => import('./pages/HealthVault'));
const EmergencyCard       = lazy(() => import('./pages/EmergencyCard'));
const PrescriptionScanner = lazy(() => import('./pages/PrescriptionScanner'));
const AIAssistant         = lazy(() => import('./pages/AIAssistant'));
const StockPrediction     = lazy(() => import('./pages/StockPrediction'));
const Wellness            = lazy(() => import('./pages/Wellness'));
const Security            = lazy(() => import('./pages/Security'));
const Settings            = lazy(() => import('./pages/Settings'));
const PublicEmergencyCard = lazy(() => import('./pages/PublicEmergencyCard'));

// ── Doctor pages — lazy loaded ────────────────────────────────────────────────
const DoctorDashboard     = lazy(() => import('./pages/doctor/DoctorDashboard'));
const MyPatients          = lazy(() => import('./pages/doctor/MyPatients'));
const PatientDetail       = lazy(() => import('./pages/doctor/PatientDetail'));
const ClinicalNotes       = lazy(() => import('./pages/doctor/ClinicalNotes'));
const PrescriptionGenerator = lazy(() => import('./pages/doctor/PrescriptionGenerator'));
const AdherenceAnalytics  = lazy(() => import('./pages/doctor/AdherenceAnalytics'));
const FollowUpDashboard   = lazy(() => import('./pages/doctor/FollowUpDashboard'));
const DoctorAppointments  = lazy(() => import('./pages/doctor/DoctorAppointments'));
const DoctorAIAssistant   = lazy(() => import('./pages/doctor/DoctorAIAssistant'));
const DoctorReports       = lazy(() => import('./pages/doctor/DoctorReports'));
const DoctorCommunication = lazy(() => import('./pages/doctor/DoctorCommunication'));
const DoctorEmergency     = lazy(() => import('./pages/doctor/DoctorEmergency'));
const DoctorMedicalRecords= lazy(() => import('./pages/doctor/DoctorMedicalRecords'));
const DoctorPerformance   = lazy(() => import('./pages/doctor/DoctorPerformance'));
const DoctorSecurity      = lazy(() => import('./pages/doctor/DoctorSecurity'));
const DoctorNotifications = lazy(() => import('./pages/doctor/DoctorNotifications'));
const DoctorSettings      = lazy(() => import('./pages/doctor/DoctorSettings'));

// ── Admin pages — lazy loaded ─────────────────────────────────────────────────
const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement      = lazy(() => import('./pages/admin/UserManagement'));
const DoctorManagement    = lazy(() => import('./pages/admin/DoctorManagement'));
const AdminAppointments   = lazy(() => import('./pages/admin/AdminAppointments'));
const AdminPrescriptions  = lazy(() => import('./pages/admin/AdminPrescriptions'));
const SystemReports       = lazy(() => import('./pages/admin/SystemReports'));
const AdminAuditLogs      = lazy(() => import('./pages/admin/AdminAuditLogs'));
const AdminSettings       = lazy(() => import('./pages/admin/AdminSettings'));
const SecretAdminAuth     = lazy(() => import('./pages/admin/SecretAdminAuth'));

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (user) {
    const role = user.role;
    if (role === 'admin' || role === 'ROLE_ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'doctor' || role === 'ROLE_DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PatientRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function DoctorRoute({ children }) {
  const { user, loading, isDoctor } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (!isDoctor) return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin, isDoctor } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (isDoctor) return <Navigate to="/doctor/dashboard" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><AuthPage /></PublicRoute>} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/secure/admin" element={<SecretAdminAuth />} />
        <Route path="/public/emergency-card/:userId" element={<PublicEmergencyCard />} />

        {/* Patient routes */}
        <Route path="/dashboard"    element={<PatientRoute><AppLayout><Dashboard /></AppLayout></PatientRoute>} />
        <Route path="/medications"  element={<PatientRoute><AppLayout><Medications /></AppLayout></PatientRoute>} />
        <Route path="/dose-log"     element={<PatientRoute><AppLayout><DoseLog /></AppLayout></PatientRoute>} />
        <Route path="/members"      element={<PatientRoute><AppLayout><Members /></AppLayout></PatientRoute>} />
        <Route path="/health-log"   element={<PatientRoute><AppLayout><HealthLog /></AppLayout></PatientRoute>} />
        <Route path="/refill-alerts"element={<PatientRoute><AppLayout><RefillAlerts /></AppLayout></PatientRoute>} />
        <Route path="/reminders"    element={<PatientRoute><AppLayout><Reminders /></AppLayout></PatientRoute>} />
        <Route path="/appointments"  element={<PatientRoute><AppLayout><Appointments /></AppLayout></PatientRoute>} />
        <Route path="/adherence"     element={<PatientRoute><AppLayout><Adherence /></AppLayout></PatientRoute>} />
        <Route path="/health-timeline" element={<PatientRoute><AppLayout><HealthTimeline /></AppLayout></PatientRoute>} />
        <Route path="/health-vault"  element={<PatientRoute><AppLayout><HealthVault /></AppLayout></PatientRoute>} />
        <Route path="/emergency-card" element={<PatientRoute><AppLayout><EmergencyCard /></AppLayout></PatientRoute>} />
        <Route path="/prescription-scanner" element={<PatientRoute><AppLayout><PrescriptionScanner /></AppLayout></PatientRoute>} />
        <Route path="/ai-assistant"  element={<PatientRoute><AppLayout><AIAssistant /></AppLayout></PatientRoute>} />
        <Route path="/stock"         element={<PatientRoute><AppLayout><StockPrediction /></AppLayout></PatientRoute>} />
        <Route path="/wellness"      element={<PatientRoute><AppLayout><Wellness /></AppLayout></PatientRoute>} />
        <Route path="/security"      element={<PatientRoute><AppLayout><Security /></AppLayout></PatientRoute>} />
        <Route path="/settings"      element={<PatientRoute><AppLayout><Settings /></AppLayout></PatientRoute>} />

        {/* Doctor routes */}
        <Route path="/doctor/dashboard" element={<DoctorRoute><DoctorLayout><DoctorDashboard /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/patients"  element={<DoctorRoute><DoctorLayout><MyPatients /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/patients/:id" element={<DoctorRoute><DoctorLayout><PatientDetail /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/notes"     element={<DoctorRoute><DoctorLayout><ClinicalNotes /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/prescriptions" element={<DoctorRoute><DoctorLayout><PrescriptionGenerator /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/analytics"     element={<DoctorRoute><DoctorLayout><AdherenceAnalytics /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/followups"     element={<DoctorRoute><DoctorLayout><FollowUpDashboard /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/appointments"  element={<DoctorRoute><DoctorLayout><DoctorAppointments /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/ai-assistant"  element={<DoctorRoute><DoctorLayout><DoctorAIAssistant /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/reports"       element={<DoctorRoute><DoctorLayout><DoctorReports /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/messages"      element={<DoctorRoute><DoctorLayout><DoctorCommunication /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/emergency"     element={<DoctorRoute><DoctorLayout><DoctorEmergency /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/medical-records" element={<DoctorRoute><DoctorLayout><DoctorMedicalRecords /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/performance"   element={<DoctorRoute><DoctorLayout><DoctorPerformance /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/security"      element={<DoctorRoute><DoctorLayout><DoctorSecurity /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/notifications" element={<DoctorRoute><DoctorLayout><DoctorNotifications /></DoctorLayout></DoctorRoute>} />
        <Route path="/doctor/settings"      element={<DoctorRoute><DoctorLayout><DoctorSettings /></DoctorLayout></DoctorRoute>} />

        {/* Admin routes */}
        <Route path="/admin/dashboard"    element={<AdminRoute><AdminLayout><AdminDashboard /></AdminLayout></AdminRoute>} />
        <Route path="/admin/users"        element={<AdminRoute><AdminLayout><UserManagement /></AdminLayout></AdminRoute>} />
        <Route path="/admin/doctors"      element={<AdminRoute><AdminLayout><DoctorManagement /></AdminLayout></AdminRoute>} />
        <Route path="/admin/appointments" element={<AdminRoute><AdminLayout><AdminAppointments /></AdminLayout></AdminRoute>} />
        <Route path="/admin/prescriptions"element={<AdminRoute><AdminLayout><AdminPrescriptions /></AdminLayout></AdminRoute>} />
        <Route path="/admin/reports"      element={<AdminRoute><AdminLayout><SystemReports /></AdminLayout></AdminRoute>} />
        <Route path="/admin/audit-logs"   element={<AdminRoute><AdminLayout><AdminAuditLogs /></AdminLayout></AdminRoute>} />
        <Route path="/admin/settings"     element={<AdminRoute><AdminLayout><AdminSettings /></AdminLayout></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
