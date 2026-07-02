-- Tắt kiểm tra khóa ngoại để thực hiện chỉnh sửa an toàn
SET FOREIGN_KEY_CHECKS = 0;

USE kindergarten_db;

-- 1. Xóa các cột Generated Columns phụ thuộc trước để gỡ bỏ hoàn toàn liên kết
ALTER TABLE `invoices` DROP COLUMN `total_amount`;
ALTER TABLE `invoices` DROP COLUMN `meal_amount`;

-- 2. Xóa các cột cũ không dùng nữa (tuition_amount, meal_days, meal_daily_rate, other_fees, discount)
ALTER TABLE `invoices` DROP COLUMN `tuition_amount`;
ALTER TABLE `invoices` DROP COLUMN `meal_days`;
ALTER TABLE `invoices` DROP COLUMN `meal_daily_rate`;
ALTER TABLE `invoices` DROP COLUMN `other_fees`;
ALTER TABLE `invoices` DROP COLUMN `discount`;

-- 3. Tạo lại các cột mới dưới dạng DECIMAL bình thường (không có Generated dependency)
ALTER TABLE `invoices` ADD COLUMN `subtotal_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `month`;
ALTER TABLE `invoices` ADD COLUMN `discount_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `subtotal_amount`;
ALTER TABLE `invoices` ADD COLUMN `refund_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `discount_amount`;
ALTER TABLE `invoices` ADD COLUMN `total_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `refund_amount`;

-- Bật lại kiểm tra khóa ngoại
SET FOREIGN_KEY_CHECKS = 1;
