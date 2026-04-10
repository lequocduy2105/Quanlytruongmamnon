# Transitioning Kindergarten Management System to a Fully Dynamic Web App

Dự án hiện tại đã được thiết lập kiến trúc Microservices ở Backend và giao diện React khá đẹp mắt ở Frontend. Tuy nhiên, nó **chưa hoàn toàn là dự án động**. Một số tính năng như Đăng nhập, Dashboard cơ bản đã gọi API, nhưng rất nhiều trang (như theo dõi sức khỏe, đánh giá kỹ năng, dashboard phụ huynh) vẫn đang dùng giao diện tĩnh và dữ liệu giả (`dummyData`). 

Để biến dự án thành một website thực sự với dữ liệu động 100%, chúng ta cần kết nối Frontend nối tiếp với Backend thông qua RESTful API.

## User Review Required

> [!WARNING]
> Mức độ thay đổi này khá lớn, sẽ tác động lên toàn bộ các file giao diện tĩnh hiện có. Một số Endpoint API ở Backend chưa được định nghĩa hoàn chỉnh cho các dữ liệu giả này (như lấy danh sách đánh giá của học sinh, cấu hình lớp học). Vui lòng xác nhận sự đồng ý để thực hiện các bước dưới đây.

## Proposed Changes

Chúng ta sẽ chia công việc theo từng nhóm người dùng (Admin, Teacher, Parent) và tiến hành thay thế dữ liệu từ API thật cho Frontend. Đồng thời, Backend cũng sẽ được bổ sung các endpoint còn thiếu.

### Backend (API Gateway & Microservices)

Bổ sung các RESTful API còn thiếu để phục vụ giao diện tĩnh hiện tại:

- **Health Service:**
  - `GET /api/health/vitals`: Lấy danh sách lịch sử sức khỏe của học sinh nhằm hiển thị trên `HealthTrackerList` và `HealthRecordView`.
- **Academic Service:**
  - `GET /api/academic/assessments/:studentId`: Lấy danh sách đánh giá kỹ năng từng môn học cho `SkillAssessment` và `ComprehensiveRecord`.
  - `POST /api/academic/classes` & `POST /api/academic/subjects`: Phục vụ cho trang `AcademicSetup.jsx` của Admin.
- **System/Admin:**
  - `GET /api/admin/reports`: Lấy dữ liệu báo cáo thống kê thực tế cho `SystemReports.jsx`.

### Frontend (React Web App)

Thay thế các component chứa dữ liệu tĩnh thành các React component gọi Axios API.

#### [MODIFY] src/pages/teacher/HealthTrackerList.jsx
- Xóa mảng `dummyData`.
- Dùng `useEffect` và `axiosClient` để gọi `GET /api/health/vitals` và `GET /api/academic/students`.
- Tạo form hoặc modal để POST lên `api/health/vitals`.

#### [MODIFY] src/pages/teacher/SkillAssessment.jsx
- Loại bỏ các thông tin mock học sinh giả.
- Dùng API `GET /api/academic/students` để lấy học sinh theo lớp, sau đó cho phép giáo viên nhập liệu và gọi API `POST /api/academic/assessments`.

#### [MODIFY] src/pages/parent/ParentDashboard.jsx & HealthRecordView.jsx
- Loại bỏ dữ liệu cứng `Leo Dubois` hay báo cáo tĩnh `Weekly Digest`.
- Lấy `student_id` từ Context hoặc User auth để gọi `GET /api/parent/student/:id/records`.
- Hiển thị danh sách thực từ API cho các phần như điểm danh, biểu đồ sức khỏe và nhận xét hàng tuần.

#### [MODIFY] src/pages/admin/AcademicSetup.jsx , SystemReports.jsx & DataManagement.jsx
- Render danh sách các lớp học lấy từ `GET /api/academic/classes`.
- Cấu hình các form tạo dữ liệu (POST).
- Vẽ biểu đồ trên `SystemReports` dựa vào số liệu từ Backend thay vì số liệu ngẫu nhiên.

## Open Questions

> [!IMPORTANT]
> 1. Hiện tại thiết kế cho tính năng **"Weekly Digest"** của Phụ huynh khá chi tiết và đẹp mắt (như hoạt động ăn uống, chơi trốn tìm). Tuy nhiên Backend có lẽ chưa có một Model/Entity cụ thể cho "Daily/Weekly Activity". Bạn có muốn tôi tạo thêm một tính năng `Activity Log` bên Backend hay tạm thời chỉ dùng phần Assessments (Đánh giá kỹ năng) để hiển thị trong mục này?
> 2. Về **Health Metrics** (chiều cao, cân nặng), biểu đồ BMI đang dùng thông tin chuẩn WHO, tôi sẽ bổ sung tính toán BMI thực tế từ dữ liệu nhập vào, bạn có đồng ý không?

## Verification Plan

### Automated Tests
- Kiểm tra toàn bộ endpoint mới có trả về đúng dữ liệu chuẩn HTTP (200 / 201) hay không trên API-Gateway.

### Manual Verification
- Đăng nhập dưới Role `TEACHER`, vào trang Health Tracker, nhập liệu cân nặng cho Học sinh A. 
- Thoát ra, đăng nhập dưới Role `PARENT` của Học sinh A, duyệt vào Parent Dashboard và phải thấy dữ liệu cân nặng mới hiện lên biểu đồ.
- Đăng nhập dưới Role `ADMIN`, xem SystemReports và thấy tổng số học sinh/đánh giá tăng thay đổi.
