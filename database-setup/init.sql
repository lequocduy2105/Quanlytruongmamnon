-- ============================================================
-- Kindergarten Quality & Health Management System
-- Database Reset & Initialization Script (MySQL 8.0)
-- Chạy file này trong MySQL Workbench để reset hoàn toàn DB
-- ============================================================

-- Tắt kiểm tra khoá ngoại tạm thời để DROP dễ dàng
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa database cũ (nếu có) và tạo lại từ đầu
DROP DATABASE IF EXISTS kindergarten_db;
CREATE DATABASE kindergarten_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kindergarten_db;

-- ============================================================
-- TABLE: users (managed by auth-service)
-- Chứa tài khoản đăng nhập của Admin, Teacher, Parent
-- ============================================================
CREATE TABLE `users` (
    `id`            INT NOT NULL AUTO_INCREMENT,
    `email`         VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `role`          ENUM('ADMIN', 'TEACHER', 'PARENT') NOT NULL DEFAULT 'PARENT',
    `created_at`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE INDEX `IDX_user_email` (`email`),
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: teachers (managed by academic-service)
-- Hồ sơ giáo viên — liên kết với tài khoản users qua user_id
-- ============================================================
CREATE TABLE `teachers` (
    `id`              INT NOT NULL AUTO_INCREMENT,
    `full_name`       VARCHAR(255) NOT NULL,
    `specializations` VARCHAR(255) NOT NULL DEFAULT 'General'
                      COMMENT 'General, Early Childhood, Art & Music, Physical Education, Language Development, STEM',
    `user_id`         INT NULL
                      COMMENT 'Tài khoản users liên kết (TEACHER role)',
    `is_active`       TINYINT(1) NOT NULL DEFAULT 1,
    `class_id`        INT NULL
                      COMMENT 'Lớp giáo viên phụ trách chính (NULL = giáo viên hỗ trợ)',
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`class_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: classrooms (managed by academic-service)
-- Lớp học — mỗi lớp có 1 giáo viên phụ trách
-- ============================================================
CREATE TABLE `classrooms` (
    `id`           INT NOT NULL AUTO_INCREMENT,
    `name`         VARCHAR(255) NOT NULL
                   COMMENT 'Tên lớp VD: Lớp Bướm Vui',
    `age_group`    VARCHAR(50) NULL
                   COMMENT 'Nhóm tuổi VD: 3-4 tuổi, 4-5 tuổi, 5-6 tuổi',
    `max_capacity` INT NOT NULL DEFAULT 25
                   COMMENT 'Sĩ số tối đa',
    `teacher_id`   INT NULL,
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: students (managed by academic-service)
-- Hồ sơ học sinh — liên kết với lớp và phụ huynh
-- ============================================================
CREATE TABLE `students` (
    `id`                INT NOT NULL AUTO_INCREMENT,
    `full_name`         VARCHAR(255) NOT NULL,
    `class_id`          INT NULL
                        COMMENT 'Lớp học đang theo học',
    `guardian_user_id`  INT NULL
                        COMMENT 'Tài khoản phụ huynh (PARENT role)',
    `allergy_tags`      TEXT NULL
                        COMMENT 'Các dị ứng cách nhau bằng dấu phẩy VD: Hải sản,Đậu phộng',
    `allergy_severity`  ENUM('NONE','MILD','SEVERE','ANAPHYLACTIC') NOT NULL DEFAULT 'NONE'
                        COMMENT 'Mức độ nghiêm trọng của dị ứng',
    `emergency_action`  TEXT NULL
                        COMMENT 'Hướng xử lý khi dị ứng xảy ra VD: Gọi 115, dùng EpiPen...',
    `emergency_contact_name`     VARCHAR(100) NULL COMMENT 'Tên người liên hệ khẩn cấp',
    `emergency_contact_phone`    VARCHAR(20)  NULL COMMENT 'SĐT người liên hệ khẩn cấp',
    `emergency_contact_relation` VARCHAR(50)  NULL COMMENT 'Quan hệ: Ba/Mẹ/Ông/Bà...',
    `blood_type`        VARCHAR(5) NULL COMMENT 'Nhóm máu: A+/A-/B+/AB+/O+...',
    `medical_notes`     TEXT NULL COMMENT 'Ghi chú sức khoẻ đặc biệt (bệnh nền...)',
    `date_of_birth`     DATE NULL,
    `created_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`class_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`guardian_user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: skill_assessments (managed by academic-service)
-- Đánh giá kỹ năng học sinh theo 4 tiêu chí phát triển
-- ============================================================
CREATE TABLE `skill_assessments` (
    `id`               INT NOT NULL AUTO_INCREMENT,
    `student_id`       INT NOT NULL,
    `teacher_id`       INT NOT NULL,
    `cognitive_score`  DECIMAL(4,1) NOT NULL DEFAULT 0
                       COMMENT 'Điểm nhận thức (0-10)',
    `social_score`     DECIMAL(4,1) NOT NULL DEFAULT 0
                       COMMENT 'Điểm kỹ năng xã hội (0-10)',
    `motor_score`      DECIMAL(4,1) NOT NULL DEFAULT 0
                       COMMENT 'Điểm vận động (0-10)',
    `emotional_score`  DECIMAL(4,1) NOT NULL DEFAULT 0
                       COMMENT 'Điểm cảm xúc (0-10)',
    `deficiency_log`   TEXT NULL
                       COMMENT 'Ghi chú thiếu hụt cần cải thiện',
    `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: health_records (managed by health-service)
-- Lịch sử sức khoẻ học sinh — cân nặng, chiều cao, nhịp tim, BMI
-- ============================================================
CREATE TABLE `health_records` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `student_id`  INT NOT NULL,
    `weight`      DECIMAL(5,2) NOT NULL COMMENT 'Cân nặng (kg)',
    `height`      DECIMAL(5,2) NOT NULL COMMENT 'Chiều cao (cm)',
    `heart_rate`  INT NOT NULL           COMMENT 'Nhịp tim (bpm)',
    `bmi_value`   DECIMAL(5,2) NOT NULL  COMMENT 'Chỉ số BMI tự động tính',
    `doctor_note` TEXT NULL              COMMENT 'Ghi chú của y tá/bác sĩ',
    `logged_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: activity_logs (managed by academic-service)
-- Nhật ký hoạt động hàng ngày của học sinh
-- ============================================================
CREATE TABLE `activity_logs` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `student_id`  INT NOT NULL,
    `teacher_id`  INT NULL
                  COMMENT 'Giáo viên ghi nhật ký',
    `category`    VARCHAR(100) NOT NULL DEFAULT 'General'
                  COMMENT 'Loại hoạt động: Behavioral, Academic, Achievement, Health',
    `title`       VARCHAR(255) NOT NULL
                  COMMENT 'Tiêu đề sự kiện',
    `description` TEXT NULL
                  COMMENT 'Mô tả chi tiết',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: feedbacks (managed by academic-service)
-- Đánh giá của phụ huynh (star rating + nhận xét)
-- ============================================================
CREATE TABLE `feedbacks` (
    `id`             INT NOT NULL AUTO_INCREMENT,
    `parent_user_id` INT NULL
                     COMMENT 'user_id của phụ huynh gửi đánh giá',
    `teacher_id`     INT NULL
                     COMMENT 'Giáo viên được đánh giá (nếu có)',
    `student_id`     INT NULL
                     COMMENT 'Học sinh liên quan',
    `rating`         DECIMAL(3,1) NOT NULL
                     COMMENT 'Điểm đánh giá từ 1.0 đến 5.0',
    `comment`        TEXT NULL
                     COMMENT 'Nhận xét văn bản',
    `submitted_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: attendance (điểm danh độc lập)
-- Mỗi học sinh chỉ có 1 bản ghi điểm danh / ngày (UNIQUE)
-- status: present | absent_excused | absent_unexcused | late
-- ============================================================
CREATE TABLE `attendance` (
    `id`          INT NOT NULL AUTO_INCREMENT,
    `student_id`  INT NOT NULL,
    `date`        DATE NOT NULL
                  COMMENT 'Ngày điểm danh (YYYY-MM-DD)',
    `status`      ENUM('present','absent_excused','absent_unexcused','late') NOT NULL DEFAULT 'present'
                  COMMENT 'present=Có mặt, absent_excused=Vắng có phép, absent_unexcused=Vắng không phép, late=Đi trễ',
    `note`        TEXT NULL
                  COMMENT 'Ghi chú lý do vắng hoặc trễ',
    `created_by`  INT NULL
                  COMMENT 'teacher.user_id của giáo viên ghi điểm danh',
    `created_at`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `IDX_attendance_student_date` (`student_id`, `date`)
                  COMMENT 'Mỗi học sinh chỉ 1 bản ghi / ngày',
    INDEX `IDX_attendance_date` (`date`),
    INDEX `IDX_attendance_student` (`student_id`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bật lại kiểm tra khoá ngoại
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABLE: typeorm_metadata (required by TypeORM)
-- TypeORM yêu cầu bảng này khi có các cột insert:false/update:false
-- (VD: GENERATED ALWAYS columns trong invoices)
-- Phải tạo ngay cả khi synchronize: false
-- ============================================================
CREATE TABLE IF NOT EXISTS `typeorm_metadata` (
  `type`     varchar(255) NOT NULL,
  `database` varchar(255)  DEFAULT NULL,
  `schema`   varchar(255)  DEFAULT NULL,
  `table`    varchar(255)  DEFAULT NULL,
  `name`     varchar(255)  DEFAULT NULL,
  `value`    text          DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: authorized_pickups (Ủy quyền đón trẻ)
-- Mỗi học sinh có thể có nhiều người được ủy quyền
-- ============================================================
CREATE TABLE `authorized_pickups` (
    `id`           INT NOT NULL AUTO_INCREMENT,
    `student_id`   INT NOT NULL
                   COMMENT 'Học sinh được đón',
    `name`         VARCHAR(100) NOT NULL
                   COMMENT 'Tên người được ủy quyền',
    `relationship` VARCHAR(50) NOT NULL
                   COMMENT 'VD: Ông/Bà/Chú/Cô/Người giúp việc',
    `phone`        VARCHAR(20) NOT NULL
                   COMMENT 'Số điện thoại liên hệ',
    `valid_from`   DATE NULL
                   COMMENT 'Ngày bắt đầu hiệu lực (NULL = ngay lập tức)',
    `valid_until`  DATE NULL
                   COMMENT 'Ngày hết hạn (NULL = vô thời hạn)',
    `photo_url`    VARCHAR(500) NULL
                   COMMENT 'URL ảnh CMND/chân dung để giáo viên đối chiếu',
    `note`         TEXT NULL
                   COMMENT 'Ghi chú thêm',
    `created_by`   INT NULL
                   COMMENT 'parent user_id tạo ủy quyền',
    `created_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_pickup_student` (`student_id`),
    INDEX `IDX_pickup_valid` (`valid_from`, `valid_until`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: fee_configs (Cấu hình học phí)
-- Cấu hình học phí theo lớp hoặc áp dụng toàn trường
-- ============================================================
CREATE TABLE `fee_configs` (
    `id`             INT NOT NULL AUTO_INCREMENT,
    `class_id`       INT NULL
                     COMMENT 'NULL = áp dụng toàn trường',
    `fee_type`       ENUM('tuition','meal','other') NOT NULL DEFAULT 'tuition'
                     COMMENT 'tuition=học phí, meal=tiền ăn, other=phí khác',
    `name`           VARCHAR(100) NOT NULL
                     COMMENT 'Tên khoản phí VD: Học phí tháng 4/2026',
    `amount`         DECIMAL(12,0) NOT NULL DEFAULT 0
                     COMMENT 'Số tiền (VND)',
    `billing_cycle`  ENUM('monthly','daily') NOT NULL DEFAULT 'monthly'
                     COMMENT 'monthly=cố định/tháng, daily=tính theo ngày có mặt',
    `effective_from` DATE NOT NULL,
    `effective_until` DATE NULL
                     COMMENT 'NULL = áp dụng vô thời hạn',
    `note`           TEXT NULL,
    `created_by`     INT NULL COMMENT 'ADMIN user_id',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_feeconfig_class` (`class_id`),
    INDEX `IDX_feeconfig_type` (`fee_type`),
    FOREIGN KEY (`class_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: invoices (Hóa đơn học phí theo tháng)
-- Mỗi học sinh có 1 hóa đơn/tháng được tạo tự động
-- ============================================================
CREATE TABLE `invoices` (
    `id`              INT NOT NULL AUTO_INCREMENT,
    `student_id`      INT NOT NULL,
    `month`           CHAR(7) NOT NULL
                      COMMENT 'Định dạng YYYY-MM VD: 2026-04',
    `tuition_amount`  DECIMAL(12,0) NOT NULL DEFAULT 0
                      COMMENT 'Học phí tháng',
    `meal_days`       INT NOT NULL DEFAULT 0
                      COMMENT 'Số ngày có mặt (tính từ attendance)',
    `meal_daily_rate` DECIMAL(12,0) NOT NULL DEFAULT 0
                      COMMENT 'Tiền ăn/ngày',
    `meal_amount`     DECIMAL(12,0) GENERATED ALWAYS AS (`meal_days` * `meal_daily_rate`) STORED
                      COMMENT 'Tiền ăn = meal_days × meal_daily_rate',
    `other_fees`      DECIMAL(12,0) NOT NULL DEFAULT 0,
    `discount`        DECIMAL(12,0) NOT NULL DEFAULT 0,
    `total_amount`    DECIMAL(12,0) GENERATED ALWAYS AS
                      (`tuition_amount` + (`meal_days` * `meal_daily_rate`) + `other_fees` - `discount`) STORED,
    `amount_paid`     DECIMAL(12,0) NOT NULL DEFAULT 0,
    `status`          ENUM('pending','partial','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
    `due_date`        DATE NULL,
    `paid_at`         DATETIME NULL,
    `note`            TEXT NULL,
    `created_by`      INT NULL COMMENT 'ADMIN user_id',
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `UQ_invoice_student_month` (`student_id`, `month`)
                      COMMENT '1 hóa đơn/học sinh/tháng',
    INDEX `IDX_invoice_status` (`status`),
    INDEX `IDX_invoice_month` (`month`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: payments (Lịch sử thanh toán)
-- ============================================================
CREATE TABLE `payments` (
    `id`             INT NOT NULL AUTO_INCREMENT,
    `invoice_id`     INT NOT NULL,
    `amount`         DECIMAL(12,0) NOT NULL,
    `payment_method` ENUM('cash','bank_transfer','card','momo','other') NOT NULL DEFAULT 'cash',
    `reference_code` VARCHAR(100) NULL
                     COMMENT 'Mã giao dịch ngân hàng / QR',
    `paid_at`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `received_by`    INT NULL COMMENT 'ADMIN/staff user_id',
    `note`           TEXT NULL,
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_payment_invoice` (`invoice_id`),
    FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: notifications (Hệ thống thông báo 2 chiều)
-- ============================================================
CREATE TABLE `notifications` (
    `id`               INT NOT NULL AUTO_INCREMENT,
    `recipient_user_id` INT NOT NULL
                         COMMENT 'user_id nhận thông báo',
    `type`             ENUM('invoice','attendance','activity','announcement','health','medication') NOT NULL,
    `title`            VARCHAR(200) NOT NULL,
    `body`             TEXT NOT NULL,
    `link_url`         VARCHAR(500) NULL
                       COMMENT 'Đường dẫn deep-link (VD: /parent/invoice/5)',
    `is_read`          BOOLEAN NOT NULL DEFAULT FALSE,
    `related_id`       INT NULL
                       COMMENT 'ID của object liên quan (invoice_id, student_id...)',
    `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_notif_recipient` (`recipient_user_id`, `is_read`),
    INDEX `IDX_notif_type` (`type`),
    INDEX `IDX_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: medication_schedules (Lịch uống thuốc kê đơn)
-- Phụ huynh nhập, giáo viên thực hiện và ghi nhận
-- ============================================================
CREATE TABLE `medication_schedules` (
    `id`                  INT NOT NULL AUTO_INCREMENT,
    `student_id`          INT NOT NULL,
    `medication_name`     VARCHAR(200) NOT NULL
                          COMMENT 'Tên thuốc VD: Amoxicillin 250mg',
    `dosage`              VARCHAR(100) NOT NULL
                          COMMENT 'Liều VD: 1 gói, 2 viên, 5ml',
    `frequency`           ENUM('once_daily','twice_daily','three_times','as_needed') NOT NULL DEFAULT 'once_daily',
    `time_morning`        TIME NULL COMMENT 'Giờ uống buổi sáng',
    `time_noon`           TIME NULL COMMENT 'Giờ uống buổi trưa',
    `time_afternoon`      TIME NULL COMMENT 'Giờ uống buổi chiều',
    `start_date`          DATE NOT NULL,
    `end_date`            DATE NULL COMMENT 'NULL = uống đến khi có lệnh dừng',
    `prescription_note`   TEXT NULL COMMENT 'Ghi chú từ bác sĩ',
    `prescription_url`    VARCHAR(500) NULL COMMENT 'URL scan đơn thuốc',
    `is_active`           BOOLEAN NOT NULL DEFAULT TRUE,
    `created_by`          INT NULL COMMENT 'parent user_id',
    `created_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_medsched_student` (`student_id`),
    INDEX `IDX_medsched_active` (`is_active`, `end_date`),
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: medication_logs (Nhật ký đã cho thuốc)
-- Giáo viên ghi nhận mỗi lần cho học sinh uống thuốc
-- ============================================================
CREATE TABLE `medication_logs` (
    `id`              INT NOT NULL AUTO_INCREMENT,
    `schedule_id`     INT NOT NULL,
    `student_id`      INT NOT NULL,
    `administered_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                      COMMENT 'Thời điểm cho uống thuốc',
    `administered_by` INT NULL COMMENT 'teacher user_id',
    `status`          ENUM('given','refused','missed') NOT NULL DEFAULT 'given'
                      COMMENT 'given=đã uống, refused=từ chối uống, missed=bỏ lỡ',
    `note`            TEXT NULL,
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_medlog_schedule` (`schedule_id`),
    INDEX `IDX_medlog_student` (`student_id`),
    INDEX `IDX_medlog_date` (`administered_at`),
    FOREIGN KEY (`schedule_id`) REFERENCES `medication_schedules`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: incident_reports (Biên bản sự cố)
-- ============================================================
CREATE TABLE `incident_reports` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `student_id`              INT NOT NULL,
    `teacher_id`              INT NOT NULL,
    `incident_type`           ENUM('INJURY', 'ILLNESS', 'BEHAVIOR', 'OTHER') DEFAULT 'OTHER',
    `severity`                ENUM('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') DEFAULT 'LOW',
    `description`             TEXT,
    `first_aid_taken`         TEXT,
    `attachment_url`          VARCHAR(500),
    `parent_acknowledged_at`  DATETIME,
    `principal_reviewed_at`   DATETIME,
    `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: support_tickets (Phản ánh phụ huynh)
-- ============================================================
CREATE TABLE `support_tickets` (
    `id`              INT AUTO_INCREMENT PRIMARY KEY,
    `parent_id`       INT NOT NULL COMMENT 'user_id',
    `student_id`      INT NULL,
    `category`        ENUM('ACADEMIC', 'FINANCE', 'NUTRITION', 'FACILITY', 'TEACHER', 'OTHER') DEFAULT 'OTHER',
    `subject`         VARCHAR(200) NOT NULL,
    `content`         TEXT NOT NULL,
    `attachment_url`  VARCHAR(500),
    `status`          ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    `assigned_to`     INT COMMENT 'admin user_id',
    `resolution_note` TEXT,
    `parent_rating`   INT,
    `resolved_at`     DATETIME,
    `created_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: leave_requests (Đơn xin nghỉ & hoàn tiền ăn)
-- ============================================================
CREATE TABLE `leave_requests` (
    `id`                      INT AUTO_INCREMENT PRIMARY KEY,
    `student_id`              INT NOT NULL,
    `requested_by`            INT NOT NULL COMMENT 'parent user_id',
    `start_date`              DATE NOT NULL,
    `end_date`                DATE NOT NULL,
    `reason`                  VARCHAR(500) NOT NULL,
    `status`                  ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
    `is_meal_refund_eligible` BOOLEAN DEFAULT FALSE,
    `meals_to_deduct`         INT DEFAULT 0,
    `refund_amount`           DECIMAL(12,0) DEFAULT 0,
    `reviewed_by`             INT COMMENT 'admin user_id',
    `review_note`             TEXT,
    `reviewed_at`             DATETIME,
    `created_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: daily_menus (managed by academic-service)
-- Thực đơn hàng ngày — Admin nhập, hệ thống cảnh báo dị ứng
-- ============================================================
CREATE TABLE `daily_menus` (
    `id`                    INT NOT NULL AUTO_INCREMENT,
    `menu_date`             DATE NOT NULL,
    `class_id`              INT NULL
                            COMMENT 'NULL = áp dụng toàn trường',
    `breakfast_main`        VARCHAR(300) NULL COMMENT 'Món chính bữa sáng',
    `breakfast_ingredients` TEXT NULL     COMMENT 'Thành phần bữa sáng',
    `lunch_main`            VARCHAR(300) NULL COMMENT 'Món chính bữa trưa',
    `lunch_soup`            VARCHAR(200) NULL COMMENT 'Canh/súp bữa trưa',
    `lunch_ingredients`     TEXT NULL     COMMENT 'Thành phần bữa trưa',
    `snack_main`            VARCHAR(200) NULL COMMENT 'Bữa xế',
    `snack_ingredients`     TEXT NULL     COMMENT 'Thành phần bữa xế',
    `notes`                 TEXT NULL,
    `created_by`            INT NULL,
    `created_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `IDX_menu_date` (`menu_date`),
    FOREIGN KEY (`class_id`) REFERENCES `classrooms`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA — Tài khoản demo mặc định
-- Mật khẩu: password123 (bcrypt rounds=10)
-- ============================================================
INSERT INTO `users` (`email`, `password_hash`, `role`) VALUES
('admin@school.com',    '$2b$10$Jj2Iilh.pV71bOZ4e.OkqO/gi79VYkK7fEo9uFAASXBWHvbemBJsC', 'ADMIN'),
('teacher@school.com',  '$2b$10$Jj2Iilh.pV71bOZ4e.OkqO/gi79VYkK7fEo9uFAASXBWHvbemBJsC', 'TEACHER'),
('teacher2@school.com', '$2b$10$Jj2Iilh.pV71bOZ4e.OkqO/gi79VYkK7fEo9uFAASXBWHvbemBJsC', 'TEACHER'),
('parent@school.com',   '$2b$10$Jj2Iilh.pV71bOZ4e.OkqO/gi79VYkK7fEo9uFAASXBWHvbemBJsC', 'PARENT'),
('parent2@school.com',  '$2b$10$Jj2Iilh.pV71bOZ4e.OkqO/gi79VYkK7fEo9uFAASXBWHvbemBJsC', 'PARENT');

-- ============================================================
-- SEED DATA — Giáo viên demo
-- user_id khớp với bảng users ở trên (teacher = id 2, teacher2 = id 3)
-- ============================================================
INSERT INTO `teachers` (`full_name`, `specializations`, `user_id`, `is_active`) VALUES
('Trần Ngọc Ánh',   'Giáo Dục Mầm Non',    2, 1),
('Nguyễn Văn Minh', 'Thể Dục & Nghệ Thuật', 3, 1);

-- Sau khi INSERT classrooms, cập nhật class_id cho giáo viên
-- (dùng UPDATE vì cần classroom ID đã tồn tại trước)

-- ============================================================
-- SEED DATA — Lớp học demo (teacher_id khớp với bảng teachers)
-- ============================================================
INSERT INTO `classrooms` (`name`, `age_group`, `max_capacity`, `teacher_id`) VALUES
('Lớp Bướm Vui', '4-5 tuổi', 20, 1),
('Lớp Sao Sáng', '5-6 tuổi', 20, 2);

-- Gán lớp cho giáo viên (sau khi classrooms đã có ID)
UPDATE `teachers` SET `class_id` = 1 WHERE `id` = 1; -- Trần Ngọc Ánh phụ trách Lớp Bướm Vui
UPDATE `teachers` SET `class_id` = 2 WHERE `id` = 2; -- Nguyễn Văn Minh phụ trách Lớp Sao Sáng

-- ============================================================
-- SEED DATA — Học sinh demo
-- class_id: 1 = Lớp Bướm Vui, 2 = Lớp Sao Sáng
-- guardian_user_id: 4 = parent@school.com, 5 = parent2@school.com
-- date_of_birth: học sinh mầm non sinh khoảng 2019-2022
-- ============================================================
INSERT INTO `students` (`full_name`, `class_id`, `guardian_user_id`, `allergy_tags`, `allergy_severity`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relation`, `blood_type`, `date_of_birth`) VALUES
('Lê Quốc Duy',    1, 4, 'Hải sản',          'SEVERE',       'Lê Văn Hùng',  '0901 234 567', 'Ba',  'O+', '2020-05-15'),
('Nguyễn Thị Mai',  1, 4, NULL,                'NONE',         'Nguyễn Thị Lan','0912 345 678', 'Mẹ',  'A+', '2020-08-20'),
('Trần Bảo Châu',  2, 5, 'Đậu phộng,Sữa bò', 'ANAPHYLACTIC', 'Trần Mạnh Hùng','0933 456 789', 'Ba',  'B+', '2019-11-10');

-- ============================================================
-- SEED DATA — Mẫu đánh giá kỹ năng
-- student_id: 1=Lê Quốc Duy, teacher_id: 1=Trần Ngọc Ánh
-- ============================================================
INSERT INTO `skill_assessments`
  (`student_id`, `teacher_id`, `cognitive_score`, `social_score`, `motor_score`, `emotional_score`, `deficiency_log`)
VALUES
  (1, 1, 8.0, 7.5, 9.0, 8.5, NULL),
  (2, 1, 7.0, 8.0, 7.5, 9.0, 'Cần cải thiện kỹ năng đọc');

-- ============================================================
-- SEED DATA — Nhật ký hoạt động mẫu
-- ============================================================
INSERT INTO `activity_logs` (`student_id`, `category`, `title`, `description`) VALUES
(1, 'Behavioral', 'Tích cực tham gia', 'Em Lê Quốc Duy tham gia tốt các hoạt động nhóm hôm nay.'),
(2, 'Academic',   'Tiến bộ đọc chữ',  'Em Nguyễn Thị Mai đã nhận biết được 10 chữ cái mới.');

-- ============================================================
-- SEED DATA — Cấu hình học phí mẫu
-- ============================================================
INSERT INTO `fee_configs` (`class_id`, `fee_type`, `name`, `amount`, `billing_cycle`, `effective_from`, `created_by`) VALUES
(NULL,  'tuition', 'Học phí tháng 4/2026',     1500000, 'monthly', '2026-04-01', 1),
(NULL,  'meal',    'Tiền ăn (tính theo ngày)',   25000,  'daily',   '2026-04-01', 1),
(NULL,  'other',   'Phí cơ sở vật chất Q2/2026', 200000, 'monthly', '2026-04-01', 1);

-- ============================================================
-- SEED DATA — Hóa đơn mẫu tháng 4/2026 (3 học sinh, 20 ngày ăn)
-- ============================================================
INSERT INTO `invoices` (`student_id`, `month`, `tuition_amount`, `meal_days`, `meal_daily_rate`, `other_fees`, `amount_paid`, `status`, `due_date`, `created_by`) VALUES
(1, '2026-04', 1500000, 18, 25000, 200000, 1700000, 'partial', '2026-04-15', 1),
(2, '2026-04', 1500000, 20, 25000, 200000, 0,       'pending', '2026-04-15', 1),
(3, '2026-04', 1500000, 15, 25000, 200000, 2075000, 'paid',    '2026-04-15', 1);

-- ============================================================
-- SEED DATA — Lịch uống thuốc mẫu (học sinh 1 đang uống kháng sinh)
-- ============================================================
INSERT INTO `medication_schedules` (`student_id`, `medication_name`, `dosage`, `frequency`, `time_morning`, `time_noon`, `start_date`, `end_date`, `prescription_note`, `is_active`, `created_by`) VALUES
(1, 'Amoxicillin 250mg', '1 gói pha với nước ấm', 'twice_daily', '07:30:00', '11:30:00', '2026-04-08', '2026-04-14', 'Kháng sinh theo đơn BS. Nguyễn - Bệnh viện Nhi', 1, 4),
(2, 'Vitamin D3 400IU',  '1 viên nhai',           'once_daily',  '07:30:00', NULL,       '2026-04-01', NULL,         'Bổ sung vitamin D theo chỉ định',                1, 4);

-- ============================================================
-- SEED DATA — Thông báo mẫu (cho phụ huynh id 4 và 5)
-- ============================================================
INSERT INTO `notifications` (`recipient_user_id`, `type`, `title`, `body`, `link_url`, `is_read`, `related_id`) VALUES
(4, 'invoice',    'Hóa đơn tháng 4/2026',             'Hóa đơn tháng 4/2026 đã được tạo. Số tiền cần thanh toán: 500,000 ₫',              '/parent/invoices', 0, 1),
(4, 'medication', 'Nhắc thuốc: Amoxicillin',           'Lê Quốc Duy cần uống Amoxicillin lúc 11:30 hôm nay',                               '/parent/dashboard', 0, 1),
(4, 'attendance', 'Điểm danh hôm nay',                 'Lê Quốc Duy đã có mặt tại lớp Bướm Vui.',                                          '/parent/dashboard', 1, NULL),
(5, 'invoice',    'Hóa đơn tháng 4/2026 đã thanh toán','Hóa đơn tháng 4/2026 của Trần Bảo Châu đã được thanh toán đầy đủ.',                '/parent/invoices',  0, 3),
(1, 'announcement','Họp phụ huynh cuối tháng',         'Kính mời phụ huynh tham dự buổi họp tổng kết tháng 4 lúc 17h ngày 30/04/2026.',    NULL,               0, NULL);

-- ============================================================
-- Giải thích ý nghĩa từng bảng đối với đề tài:
--
-- users              → Xác thực đăng nhập (3 vai trò: Admin, Giáo viên, Phụ huynh)
-- teachers           → Hồ sơ giáo viên, chuyên môn giảng dạy
-- classrooms         → Lớp học mầm non, phân công giáo viên, sĩ số
-- students           → Học sinh, thông tin dị ứng, liên kết phụ huynh & lớp học
-- skill_assessments  → Đánh giá 4 tiêu chí phát triển: nhận thức, xã hội, vận động, cảm xúc
-- health_records     → Theo dõi sức khoẻ định kỳ: cân nặng, chiều cao, BMI, nhịp tim
-- activity_logs      → Nhật ký hoạt động hàng ngày của học sinh
-- feedbacks          → Phản hồi 2 chiều: phụ huynh đánh giá giáo viên/nhà trường
-- attendance         → Điểm danh mỗi ngày (học sinh × ngày) — UNIQUE để tránh trùng
-- authorized_pickups → Danh sách người được ủy quyền đón trẻ
-- fee_configs        → Cấu hình học phí theo loại (học phí, tiền ăn, phí khác)
-- invoices           → Hóa đơn học phí mỗi tháng mỗi học sinh (tự động tính)
-- payments           → Lịch sử ghi nhận thanh toán hóa đơn
-- notifications      → Hệ thống thông báo 2 chiều (Admin ↔ Phụ huynh ↔ Giáo viên)
-- medication_schedules → Lịch uống thuốc kê đơn, phụ huynh nhập
-- medication_logs    → Nhật ký giáo viên xác nhận đã cho uống thuốc mỗi lần
-- ============================================================

-- ============================================================
-- HƯỚNG DẪN SỬ DỤNG SAU KHI CHẠY SCRIPT NÀY:
-- -----------------------------------------------------------
-- Admin:        admin@school.com    / password123
-- Giáo viên 1: teacher@school.com  / password123  (Trần Ngọc Ánh - Lớp Bướm Vui)
-- Giáo viên 2: teacher2@school.com / password123  (Nguyễn Văn Minh - Lớp Sao Sáng)
-- Phụ huynh 1: parent@school.com   / password123  (con: Lê Quốc Duy, Nguyễn Thị Mai)
-- Phụ huynh 2: parent2@school.com  / password123  (con: Trần Bảo Châu)
--
-- ĐỂ LINK CON (phụ huynh 1 - Lê Quốc Duy):
--   Họ tên: Lê Quốc Duy
--   Ngày sinh: 2020-05-15
--   Lớp: Lớp Bướm Vui
--
-- DỮ LIỆU MẪU:
--   - 3 hóa đơn tháng 4/2026 (partial, pending, paid)
--   - 2 đơn thuốc đang hoạt động
--   - 5 thông báo (3 cho phụ huynh 1, 2 cho phụ huynh 2 và admin)
-- ============================================================

