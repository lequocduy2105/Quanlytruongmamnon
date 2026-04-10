import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AdminLayout from "./layouts/AdminLayout";
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import DataManagement from "./pages/admin/DataManagement";
import TeacherRegistry from "./pages/admin/TeacherRegistry";
import StudentRegistry from "./pages/admin/StudentRegistry";
import ClassReports from "./pages/admin/ClassReports";

// Teacher Bound
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import HealthTrackerList from "./pages/teacher/HealthTrackerList";
import SkillAssessment from "./pages/teacher/SkillAssessment";

// Parent Bound
import ParentLayout from "./layouts/ParentLayout";
import ParentDashboard from "./pages/parent/ParentDashboard";
import HealthRecordView from "./pages/parent/HealthRecordView";
import ComprehensiveRecord from "./pages/parent/ComprehensiveRecord";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin Bounds */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<ExecutiveDashboard />} />
          <Route path="dashboard" element={<ExecutiveDashboard />} />
          <Route path="data" element={<DataManagement />} />
          <Route path="teachers" element={<TeacherRegistry />} />
          <Route path="students" element={<StudentRegistry />} />
          <Route path="class-reports" element={<ClassReports />} />
        </Route>

        {/* Teacher Bounds */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="health" element={<HealthTrackerList />} />
          <Route path="assessments" element={<SkillAssessment />} />
        </Route>

        {/* Parent Bounds */}
        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<ParentDashboard />} />
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="health" element={<HealthRecordView />} />
          <Route path="record" element={<ComprehensiveRecord />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
