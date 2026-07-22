import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './components/Layout/AppLayout';
import DoctorLayout from './components/Layout/DoctorLayout';
import AdminLayout from './components/Layout/AdminLayout';
import AuthPage     from './pages/AuthPage';
import Dashboard    from './pages/Dashboard';
import Medications  from './pages/Medications';
import DoseLog      from './pages/DoseLog';
import Members      from './pages/Members';
import HealthLog    from './pages/HealthLog';
import RefillAlerts from './pages/RefillAlerts';
import Reminders    from './pages/Reminders';

// Feature pages
import Appointments         from './pages/Appointments';
import Adherence            from './pages/Adherence';
import HealthTimeline       from './pages/HealthTimeline';
import HealthVault          from './pages/HealthVault';
import EmergencyCard        from './pages/EmergencyCard';
import PrescriptionScanner  from './pages/PrescriptionScanner';
import AIAssistant          from './pages/AIAssistant';
import StockPrediction      from './pages/StockPrediction';
import PublicEmergencyCard  from './pages/PublicEmergencyCard';
import Wellness             from './pages/Wellness';
import Security             from './pages/Security';
import Settings            from './pages/Settings';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import MyPatients      from './pages/doctor/MyPatients';
import PatientDetail   from './pages/doctor/PatientDetail';
import ClinicalNotes   from './pages/doctor/ClinicalNotes';
import PrescriptionGenerator from './pages/doctor/PrescriptionGenerator';
import AdherenceAnalytics from './pages/doctor/AdherenceAnalytics';
import FollowUpDashboard from './pages/doctor/FollowUpDashboard';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorAIAssistant from './pages/doctor/DoctorAIAssistant';
import DoctorReports from './pages/doctor/DoctorReports';
import DoctorCommunication from './pages/doctor/DoctorCommunication';
import DoctorEmergency from './pages/doctor/DoctorEmergency';
import DoctorMedicalRecords from './pages/doctor/DoctorMedicalRecords';
import DoctorPerformance from './pages/doctor/DoctorPerformance';
import DoctorSecurity from './pages/doctor/DoctorSecurity';
import DoctorNotifications from './pages/doctor/DoctorNotifications';
import DoctorSettings from './pages/doctor/DoctorSettings';

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import UserManagement     from './pages/admin/UserManagement';
import DoctorManagement   from './pages/admin/DoctorManagement';
import SystemReports      from './pages/admin/SystemReports';
import AdminAppointments  from './pages/admin/AdminAppointments';
import AdminPrescriptions from './pages/admin/AdminPrescriptions';
import AdminAuditLogs     from './pages/admin/AdminAuditLogs';
import AdminSettings      from './pages/admin/AdminSettings';

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 16, background: 'var(--bg-primary)' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 24 }}>💊</span>
      </div>
      <div className="spinner" style={{ width: 28, height: 28 }} />
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading DoseTracker...</p>
    </div>
  );
}

function PatientRoute({ children }) {
  const { user, loading, isDoctor, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
  if (isDoctor) return <Navigate to="/doctor/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading, isAdmin, isDoctor } = useAuth();
  if (loading) return null;
  if (!user) return children;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
  if (isDoctor) return <Navigate to="/doctor/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

function DoctorRoute({ children }) {
  const { user, loading, isDoctor, isAdmin } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/" replace />;
  if (isAdmin)  return <Navigate to="/admin/dashboard" replace />;
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
    <Routes>
      <Route path="/" element={<PublicRoute><AuthPage /></PublicRoute>} />
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
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '13px',
              },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
