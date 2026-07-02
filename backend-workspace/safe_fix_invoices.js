const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'kindergarten_db'
  });

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  const drops = [
    "ALTER TABLE `invoices` DROP COLUMN `total_amount`",
    "ALTER TABLE `invoices` DROP COLUMN `meal_amount`",
    "ALTER TABLE `invoices` DROP COLUMN `tuition_amount`",
    "ALTER TABLE `invoices` DROP COLUMN `meal_days`",
    "ALTER TABLE `invoices` DROP COLUMN `meal_daily_rate`",
    "ALTER TABLE `invoices` DROP COLUMN `other_fees`",
    "ALTER TABLE `invoices` DROP COLUMN `discount`"
  ];

  const adds = [
    "ALTER TABLE `invoices` ADD COLUMN `subtotal_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `month`",
    "ALTER TABLE `invoices` ADD COLUMN `discount_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `subtotal_amount`",
    "ALTER TABLE `invoices` ADD COLUMN `refund_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `discount_amount`",
    "ALTER TABLE `invoices` ADD COLUMN `total_amount` DECIMAL(12,0) NOT NULL DEFAULT 0 AFTER `refund_amount`"
  ];

  console.log("Dropping old/generated columns...");
  for (const sql of drops) {
    try {
      await connection.query(sql);
      console.log(`Executed: ${sql}`);
    } catch (err) {
      console.log(`Skipped (not found or already deleted): ${sql} - Error: ${err.message}`);
    }
  }

  console.log("Adding new financial columns...");
  for (const sql of adds) {
    try {
      await connection.query(sql);
      console.log(`Executed: ${sql}`);
    } catch (err) {
      console.log(`Skipped (already exists): ${sql} - Error: ${err.message}`);
    }
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  console.log("Database invoices table synchronization complete!");
  await connection.end();
}

run();
