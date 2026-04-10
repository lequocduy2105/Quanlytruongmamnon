# Task Tracker: Full Dynamic API Integration

- [x] Task 1: Backend - Health Service API Update
  - [x] Thêm endpoint `GET /api/health/vitals` trong Health Service.
  - [x] Expose ra trên API Gateway (`api-gateway.controller.ts`).
- [x] Task 2: Backend - Academic Service & Activity Logs
  - [x] Định nghĩa thêm `ActivityLog` entity để hỗ trợ "Weekly Digest" và viết service tương ứng.
  - [x] Thêm endpoint `GET /api/academic/assessments/:studentId`.
  - [x] Thêm các endpoint cho `classes`, `subjects` (POST, PATCH) để Admin cấu hình.
  - [x] Expose các endpoint lên API Gateway.
- [x] Task 3: Frontend - Teacher Section
  - [x] Cập nhật `HealthTrackerList.jsx`: Gọi GET vitals, POST vitals, tính logic BMI.
  - [x] Cập nhật `SkillAssessment.jsx`: Gọi GET học sinh và POST assessment.
- [x] Task 4: Frontend - Parent Section
  - [x] Cập nhật `ParentDashboard.jsx`: Gọi API lấy Activity Logs, Attendance, Weekly Digest.
  - [x] Cập nhật `HealthRecordView.jsx` và `ComprehensiveRecord.jsx`.
- [x] Task 5: Frontend - Admin Section
  - [x] Cập nhật `AcademicSetup.jsx` gọi API tạo/cập nhật lớp.
  - [x] Cập nhật `SystemReports.jsx` với stat API thật.
