// 📁 src/i18n/translations.js
// Toàn bộ chuỗi văn bản của hệ thống - Tiếng Việt & Tiếng Anh

const translations = {
  vi: {
    // ─── Layout chung ───
    logout: "Đăng xuất",
    notifications: "Thông báo",
    loading: "Đang tải...",
    noData: "Chưa có dữ liệu",
    save: "Lưu",
    cancel: "Hủy",
    close: "Đóng",
    create: "Tạo mới",
    add: "Thêm",
    edit: "Chỉnh sửa",
    delete: "Xóa",
    search: "Tìm kiếm",
    export: "Xuất file",
    print: "In",
    submit: "Gửi",

    // ─── Admin Layout ───
    adminRole: "Ban Giám Hiệu",
    adminSub: "Quản trị viên",
    systemName: "Atelier Management",
    systemSub: "Quality & Health System",

    // ─── Admin Nav ───
    nav_dashboard: "Dashboard",
    nav_students: "Học Sinh",
    nav_teachers: "Giáo Viên",
    nav_data: "Quản Lý Dữ Liệu",
    nav_academic: "Học Thuật",
    nav_class_reports: "Báo Cáo Lớp",
    nav_reports: "Báo Cáo",
    nav_finance: "Học Phí",

    // ─── Teacher Layout ───
    teacherPortal: "Teacher Portal",
    nav_health: "Theo Dõi Sức Khoẻ",
    nav_assessments: "Đánh Giá Kỹ Năng",
    nav_medications: "Quản Lý Thuốc",
    quickLog: "Ghi Nhanh",

    // ─── Parent Layout ───
    nav_parentDashboard: "Dashboard",
    nav_healthRecord: "Hồ Sơ Sức Khoẻ",
    nav_fullRecord: "Hồ Sơ Toàn Diện",
    nav_teacherFeedback: "Đánh Giá Giáo Viên",
    nav_invoices: "Học Phí",
    nav_pickups: "Ủy Quyền Đón Trẻ",
    nav_myMedications: "Đơn Thuốc",


    // ─── Executive Dashboard ───
    dash_morning: "Tổng Quan Buổi Sáng",
    dash_vitality: "Điểm Sinh Lực",
    dash_lastUpdated: "Cập nhật lúc",
    dash_totalStudents: "Tổng Học Sinh",
    dash_activeTeachers: "Giáo Viên",
    dash_parentRating: "Đánh Giá Phụ Huynh",
    dash_deficiencies: "Vấn Đề Cần Xử Lý",
    dash_ratingTrend: "Xu Hướng Đánh Giá",
    dash_ratingDesc: "Mức độ hài lòng hàng tháng",
    dash_healthStatus: "Tình Trạng Sức Khoẻ",
    dash_bmi: "Phân bố BMI",
    dash_normal: "Bình Thường",
    dash_under: "Thiếu Cân",
    dash_over: "Thừa Cân",
    dash_stable: "Ổn Định",
    dash_actionRequired: "Cần Hành Động",
    dash_noRating: "Chưa có dữ liệu",

    // ─── Student Registry ───
    students_title: "Danh Sách Học Sinh",
    students_sub: "Quản lý toàn bộ hồ sơ học sinh",
    students_add: "Thêm Học Sinh",
    students_name: "Họ và Tên",
    students_class: "Lớp",
    students_allergy: "Dị Ứng",
    students_noAllergy: "Không có",
    students_empty: "Chưa có học sinh nào trong hệ thống.",
    students_modal_title: "Thêm Học Sinh Mới",
    students_modal_name: "Họ và tên học sinh",
    students_modal_class: "Chọn lớp học",
    students_modal_allergy: "Dị ứng (cách nhau bằng dấu phẩy)",

    // ─── Teacher Registry ───
    teachers_title: "Danh Sách Giáo Viên",
    teachers_sub: "Quản lý đội ngũ giảng dạy",
    teachers_onboard: "Onboard Giáo Viên",
    teachers_name: "Tên Giáo Viên",
    teachers_spec: "Chuyên Môn",
    teachers_status: "Trạng Thái",
    teachers_active: "Đang hoạt động",
    teachers_inactive: "Ngừng hoạt động",
    teachers_empty: "Chưa có giáo viên nào. Hãy onboard giáo viên đầu tiên!",
    teachers_modal_title: "Onboard Giáo Viên Mới",
    teachers_modal_name: "Họ và tên đầy đủ",
    teachers_modal_spec: "Chuyên môn giảng dạy",

    // ─── Academic Setup ───
    academic_title: "Thiết Lập Chương Trình Học",
    academic_sub: "Cấu hình lớp học và phân công giáo viên",
    academic_addClass: "+ Tạo Lớp Học",
    academic_class: "Tên Lớp",
    academic_teacher: "Giáo Viên Phụ Trách",
    academic_students: "Học Sinh",
    academic_capacity: "Sĩ Số",
    academic_ageGroup: "Độ Tuổi",
    academic_noClass: "Chưa có lớp học nào.",
    academic_modal_title: "Tạo Lớp Học Mới",
    academic_modal_className: "Tên lớp học",
    academic_modal_ageGroup: "Độ tuổi (VD: 4-5 tuổi)",
    academic_modal_teacher: "Chọn giáo viên phụ trách",
    academic_modal_capacity: "Sĩ số tối đa",
    academic_noTeacher: "-- Chưa phân công --",

    // ─── Data Management ───
    data_title: "Quản Lý Dữ Liệu",
    data_sub: "Xuất và sao lưu dữ liệu hệ thống",
    data_studentDir: "Danh Sách Học Sinh",
    data_studentSub: "Xuất danh sách học sinh ra file CSV",
    data_teacherProfiles: "Hồ Sơ Giáo Viên",
    data_teacherSub: "Quản lý hồ sơ giáo viên đang hoạt động",
    data_exportCSV: "Xuất CSV",
    data_exportPDF: "Xuất PDF",

    // ─── System Reports ───
    reports_title: "Báo Cáo Hệ Thống",
    reports_sub: "Tổng hợp và phân tích dữ liệu toàn trường",
    reports_export: "Xuất PDF",

    // ─── Teacher Dashboard ───
    teacher_dash_title: "Bảng Tổng Quan",
    teacher_dash_present: "Có Mặt",
    teacher_dash_absent: "Vắng Mặt",
    teacher_dash_late: "Đi Trễ",
    teacher_dash_alerts: "Cảnh Báo",
    teacher_dash_tasks: "Việc Cần Làm",

    // ─── Health Tracker ───
    health_title: "Theo Dõi Sức Khoẻ",
    health_sub: "Ghi nhận và theo dõi chỉ số sức khoẻ học sinh",
    health_weight: "Cân nặng (kg)",
    health_height: "Chiều cao (cm)",
    health_heartRate: "Nhịp tim (bpm)",
    health_bmi: "BMI",
    health_note: "Ghi chú bác sĩ",
    health_submit: "Ghi Nhận",
    health_history: "Lịch Sử Khám",

    // ─── Skill Assessment ───
    assessment_title: "Đánh Giá Kỹ Năng",
    assessment_sub: "Theo dõi năng lực phát triển học sinh",
    assessment_cognitive: "Nhận Thức",
    assessment_social: "Xã Hội",
    assessment_motor: "Vận Động",
    assessment_emotional: "Cảm Xúc",
    assessment_deficiency: "Ghi chú thiếu hụt (nếu có)",
    assessment_submit: "Lưu Đánh Giá",

    // ─── Parent Dashboard ───
    parent_dash_title: "Trang Chủ Phụ Huynh",
    parent_dash_child: "Con của bạn",
    parent_dash_health: "Sức Khoẻ",
    parent_dash_academic: "Học Thuật",
    parent_dash_noChild: "Chưa có hồ sơ con được liên kết.",

    // ─── Feedback Modal ───
    feedback_title: "Đánh Giá Tháng Này",
    feedback_sub: "Vui lòng đánh giá để mở khoá hồ sơ",
    feedback_rate: "Chọn số sao",
    feedback_comment: "Nhận xét của bạn",
    feedback_submit: "Gửi Đánh Giá",

    // ─── Login Page ───
    login_title: "Đăng Nhập Hệ Thống",
    login_email: "Email",
    login_password: "Mật khẩu",
    login_btn: "Đăng Nhập",
    login_demo: "Tài Khoản Demo",
  },

  en: {
    // ─── Common ───
    logout: "Logout",
    notifications: "Notifications",
    loading: "Loading...",
    noData: "No data available",
    save: "Save",
    cancel: "Cancel",
    close: "Close",
    create: "Create",
    add: "Add",
    edit: "Edit",
    delete: "Delete",
    search: "Search",
    export: "Export",
    print: "Print",
    submit: "Submit",

    // ─── Admin Layout ───
    adminRole: "Principal",
    adminSub: "Administrator",
    systemName: "Atelier Management",
    systemSub: "Quality & Health System",

    // ─── Admin Nav ───
    nav_dashboard: "Dashboard",
    nav_students: "Students",
    nav_teachers: "Teachers",
    nav_data: "Data Management",
    nav_academic: "Academic Setup",
    nav_class_reports: "Class Reports",
    nav_reports: "Reports",
    nav_finance: "Finance",

    // ─── Teacher Layout ───
    teacherPortal: "Teacher Portal",
    nav_health: "Health Tracking",
    nav_assessments: "Skill Assessment",
    nav_medications: "Medications",
    quickLog: "Quick Log",

    // ─── Parent Layout ───
    nav_parentDashboard: "Dashboard",
    nav_healthRecord: "Health Records",
    nav_fullRecord: "Full Records",
    nav_teacherFeedback: "Rate Teacher",
    nav_invoices: "Tuition",
    nav_pickups: "Authorized Pickups",
    nav_myMedications: "Prescriptions",

    // ─── Executive Dashboard ───
    dash_morning: "Morning Snapshot",
    dash_vitality: "Atelier Vitality Score",
    dash_lastUpdated: "Last updated",
    dash_totalStudents: "Total Students",
    dash_activeTeachers: "Active Teachers",
    dash_parentRating: "Parent Rating",
    dash_deficiencies: "Open Deficiencies",
    dash_ratingTrend: "Parent Rating Trends",
    dash_ratingDesc: "Monthly satisfaction benchmark",
    dash_healthStatus: "Class Health Status",
    dash_bmi: "Growth & BMI distribution",
    dash_normal: "Normal",
    dash_under: "Under",
    dash_over: "Over",
    dash_stable: "Stable",
    dash_actionRequired: "Action Required",
    dash_noRating: "No data yet",

    // ─── Student Registry ───
    students_title: "Student Registry",
    students_sub: "Manage all student profiles",
    students_add: "Add Student",
    students_name: "Full Name",
    students_class: "Class",
    students_allergy: "Allergies",
    students_noAllergy: "None",
    students_empty: "No students found in the system.",
    students_modal_title: "Add New Student",
    students_modal_name: "Student full name",
    students_modal_class: "Select class",
    students_modal_allergy: "Allergies (comma-separated)",

    // ─── Teacher Registry ───
    teachers_title: "Teacher Registry",
    teachers_sub: "Manage teaching staff",
    teachers_onboard: "Onboard Teacher",
    teachers_name: "Teacher Name",
    teachers_spec: "Specialization",
    teachers_status: "Status",
    teachers_active: "Active",
    teachers_inactive: "Inactive",
    teachers_empty: "No teachers yet. Onboard the first teacher!",
    teachers_modal_title: "Onboard New Teacher",
    teachers_modal_name: "Full name",
    teachers_modal_spec: "Teaching specialization",

    // ─── Academic Setup ───
    academic_title: "Academic Setup",
    academic_sub: "Configure classrooms and assign teachers",
    academic_addClass: "+ Create Classroom",
    academic_class: "Class Name",
    academic_teacher: "Lead Teacher",
    academic_students: "Students",
    academic_capacity: "Capacity",
    academic_ageGroup: "Age Group",
    academic_noClass: "No classrooms found.",
    academic_modal_title: "Create New Classroom",
    academic_modal_className: "Classroom name",
    academic_modal_ageGroup: "Age group (e.g. 4-5 years)",
    academic_modal_teacher: "Select lead teacher",
    academic_modal_capacity: "Max capacity",
    academic_noTeacher: "-- Not assigned --",

    // ─── Data Management ───
    data_title: "Data Management",
    data_sub: "Export and backup system data",
    data_studentDir: "Student Directory",
    data_studentSub: "Export student list as CSV file",
    data_teacherProfiles: "Teacher Profiles",
    data_teacherSub: "Manage active educator profiles",
    data_exportCSV: "Export CSV",
    data_exportPDF: "Export PDF",

    // ─── System Reports ───
    reports_title: "System Reports",
    reports_sub: "Consolidated school-wide analytics",
    reports_export: "Export PDF",

    // ─── Teacher Dashboard ───
    teacher_dash_title: "Overview Dashboard",
    teacher_dash_present: "Present",
    teacher_dash_absent: "Absent",
    teacher_dash_late: "Late",
    teacher_dash_alerts: "Alerts",
    teacher_dash_tasks: "Tasks",

    // ─── Health Tracker ───
    health_title: "Health Tracker",
    health_sub: "Record and monitor student health metrics",
    health_weight: "Weight (kg)",
    health_height: "Height (cm)",
    health_heartRate: "Heart Rate (bpm)",
    health_bmi: "BMI",
    health_note: "Doctor note",
    health_submit: "Submit Record",
    health_history: "History",

    // ─── Skill Assessment ───
    assessment_title: "Skill Assessment",
    assessment_sub: "Track student developmental progress",
    assessment_cognitive: "Cognitive",
    assessment_social: "Social",
    assessment_motor: "Motor",
    assessment_emotional: "Emotional",
    assessment_deficiency: "Deficiency note (if any)",
    assessment_submit: "Save Assessment",

    // ─── Parent Dashboard ───
    parent_dash_title: "Parent Dashboard",
    parent_dash_child: "Your child",
    parent_dash_health: "Health",
    parent_dash_academic: "Academic",
    parent_dash_noChild: "No child profile linked to your account.",

    // ─── Feedback Modal ───
    feedback_title: "Monthly Review",
    feedback_sub: "Please rate to unlock the portal",
    feedback_rate: "Select rating",
    feedback_comment: "Your comment",
    feedback_submit: "Submit Review",

    // ─── Login Page ───
    login_title: "System Login",
    login_email: "Email",
    login_password: "Password",
    login_btn: "Sign In",
    login_demo: "Demo Accounts",
  },
};

export default translations;
