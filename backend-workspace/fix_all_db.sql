-- Tắt kiểm tra khóa ngoại tạm thời để chỉnh sửa cấu trúc bảng an toàn
SET FOREIGN_KEY_CHECKS = 0;

USE kindergarten_db;

-- ============================================================
-- 1. CẬP NHẬT BẢNG invoices (Thêm các cột tài chính thiếu)
-- ============================================================

-- Thêm các cột subtotal_amount, discount_amount, refund_amount nếu chưa tồn tại
ALTER TABLE `invoices` ADD COLUMN `subtotal_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `month`;
ALTER TABLE `invoices` ADD COLUMN `discount_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `subtotal_amount`;
ALTER TABLE `invoices` ADD COLUMN `refund_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `discount_amount`;

-- Xóa cột total_amount cũ (do là GENERATED) và định nghĩa lại thành cột bình thường
ALTER TABLE `invoices` DROP COLUMN `total_amount`;
ALTER TABLE `invoices` ADD COLUMN `total_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `refund_amount`;

-- Chuyển cột do_date thành bắt buộc (NOT NULL)
ALTER TABLE `invoices` MODIFY COLUMN `due_date` DATE NOT NULL;


-- ============================================================
-- 2. CẬP NHẬT BẢNG fee_configs (Thêm cột grade_level & sửa ENUM)
-- ============================================================

-- Thêm cột grade_level để phân loại khối lớp
ALTER TABLE `fee_configs` ADD COLUMN `grade_level` ENUM('MAM', 'CHOI', 'LA') NULL AFTER `class_id`;

-- Cập nhật kiểu ENUM cho cột fee_type để hỗ trợ các loại chi phí mới
ALTER TABLE `fee_configs` MODIFY COLUMN `fee_type` ENUM('tuition', 'meal', 'facility', 'transport', 'extracurricular', 'other') NOT NULL;

-- Cập nhật kiểu ENUM cho cột billing_cycle
ALTER TABLE `fee_configs` MODIFY COLUMN `billing_cycle` ENUM('monthly', 'daily', 'one_time') NOT NULL DEFAULT 'monthly';


-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;
