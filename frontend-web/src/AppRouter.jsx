import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LangProvider } from "./contexts/LangContext";
import ProtectedRoute from "./components/ProtectedRoute";

// ─── Layouts ───────────────────────────────────────────────
import AdminLayout from "./layouts/AdminLayout";
import TeacherLayout from "./layouts/TeacherLayout";
import ParentLayout from "./layouts/ParentLayout";

// ─── Public ────────────────────────────────────────────────
import LoginPage from "./pages/LoginPage";

// ─── Admin Pages ───────────────────────────────────────────
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import DataManagement from "./pages/admin/DataManagement";
import AcademicSetup from "./pages/admin/AcademicSetup";
import TeacherRegistry from "./pages/admin/TeacherRegistry";
import StudentRegistry from "./pages/admin/StudentRegistry";
import ClassReports from "./pages/admin/ClassReports";
import SystemReports from "./pages/admin/SystemReports";

// ─── Teacher Pages ─────────────────────────────────────────
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import HealthTrackerList from "./pages/teacher/HealthTrackerList";
import SkillAssessment from "./pages/teacher/SkillAssessment";
import MedicationManager from "./pages/teacher/MedicationManager";
import TeacherELearning from "./pages/teacher/TeacherELearning";
import TeacherChangePassword from "./pages/teacher/TeacherChangePassword";

// ─── Admin Pages (extra) ────────────────────────────────────
import FinanceManagement from "./pages/admin/FinanceManagement";
import DailyMenuManager from "./pages/admin/DailyMenuManager";

// ─── Parent Pages ──────────────────────────────────────────
import ParentDashboard from "./pages/parent/ParentDashboard";
import HealthRecordView from "./pages/parent/HealthRecordView";
import ComprehensiveRecord from "./pages/parent/ComprehensiveRecord";
import TeacherFeedback from "./pages/parent/TeacherFeedback";
import ParentInvoices from "./pages/parent/ParentInvoices";
import ParentMedications from "./pages/parent/ParentMedications";
import ParentPickups from "./pages/parent/ParentPickups";
import ParentChangePassword from "./pages/parent/ParentChangePassword";
// ─── NEW: Workflow Modules ──────────────────────────────────
import IncidentReporter from "./pages/teacher/IncidentReporter";
import IncidentDashboard from "./pages/admin/IncidentDashboard";
import LeaveRequestManager from "./pages/admin/LeaveRequestManager";
import TicketManager from "./pages/admin/TicketManager";
import ParentIncidents from "./pages/parent/ParentIncidents";
import ParentLeaveRequests from "./pages/parent/ParentLeaveRequests";
import ParentSupportTickets from "./pages/parent/ParentSupportTickets";
import TeacherPickupCheck from "./pages/teacher/TeacherPickupCheck";
import TeacherFinance from "./pages/teacher/TeacherFinance";

export default function AppRouter() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* ── Public Routes ── */}
            <Route path="/login" element={<LoginPage />} />

            {/* ── Root redirect ── */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ── Admin Routes (ADMIN only) ── */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<ExecutiveDashboard />} />
              <Route path="data" element={<DataManagement />} />
              <Route path="academic-setup" element={<AcademicSetup />} />
              <Route path="teachers" element={<TeacherRegistry />} />
              <Route path="students" element={<StudentRegistry />} />
              <Route path="class-reports" element={<ClassReports />} />
              <Route path="reports" element={<SystemReports />} />
              <Route path="finance" element={<FinanceManagement />} />
              <Route path="menu" element={<DailyMenuManager />} />
              <Route path="incidents" element={<IncidentDashboard />} />
              <Route path="leave-requests" element={<LeaveRequestManager />} />
              <Route path="tickets" element={<TicketManager />} />
            </Route>

            {/* ── Teacher Routes (TEACHER only) ── */}
            <Route
              path="/teacher"
              element={
                <ProtectedRoute allowedRoles={["TEACHER"]}>
                  <TeacherLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<TeacherDashboard />} />
              <Route path="health" element={<HealthTrackerList />} />
              <Route path="assessments" element={<SkillAssessment />} />
              <Route path="medications" element={<MedicationManager />} />
              <Route path="pickup-check" element={<TeacherPickupCheck />} />
              <Route path="incidents" element={<IncidentReporter />} />
              <Route path="finance" element={<TeacherFinance />} />
              <Route path="elearning" element={<TeacherELearning />} />
              <Route path="change-password" element={<TeacherChangePassword />} />
            </Route>

            {/* ── Parent Routes (PARENT only) ── */}
            <Route
              path="/parent"
              element={
                <ProtectedRoute allowedRoles={["PARENT"]}>
                  <ParentLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"   element={<ParentDashboard />} />
              <Route path="health"      element={<HealthRecordView />} />
              <Route path="record"      element={<ComprehensiveRecord />} />
              <Route path="feedback"    element={<TeacherFeedback />} />
              <Route path="invoices"    element={<ParentInvoices />} />
              <Route path="medications" element={<ParentMedications />} />
              <Route path="pickups"     element={<ParentPickups />} />
              <Route path="incidents"        element={<ParentIncidents />} />
              <Route path="leave-requests"   element={<ParentLeaveRequests />} />
              <Route path="tickets"          element={<ParentSupportTickets />} />
              <Route path="change-password"  element={<ParentChangePassword />} />
            </Route>

            {/* ── 404 catch-all ── */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}
