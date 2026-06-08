const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('=== KHỞI ĐỘNG CẬP NHẬT DATABASE FINANCE ===');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kindergarten_db',
  };

  console.log(`Đang kết nối tới DB: ${config.host}:${config.port}/${config.database}...`);
  
  let conn;
  try {
    conn = await mysql.createConnection(config);
    
    // 1. Disable Foreign Key Checks
    console.log('[1/4] Vô hiệu hóa kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 0)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 2. Drop existing finance tables in order
    console.log('[2/4] Đang xóa các bảng tài chính cũ...');
    const tablesToDrop = ['payments', 'invoice_items', 'invoices', 'fee_configs', 'invoice_batches'];
    for (const table of tablesToDrop) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`  + Đã DROP bảng: ${table}`);
    }
    
    // 3. Create tables
    console.log('[3/4] Đang tạo lại các bảng với cấu trúc mới...');
    
    // Table 1: fee_configs
    console.log('  + Tạo bảng fee_configs...');
    await conn.query(`
      CREATE TABLE \`fee_configs\` (
        \`id\`             INT NOT NULL AUTO_INCREMENT,
        \`class_id\`       INT NULL,
        \`grade_level\`    ENUM('MAM', 'CHOI', 'LA') NULL,
        \`fee_type\`       ENUM('tuition', 'meal', 'facility', 'transport', 'extracurricular', 'other') NOT NULL,
        \`name\`           VARCHAR(150) NOT NULL,
        \`amount\`         DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`billing_cycle\`  ENUM('monthly', 'daily', 'one_time') NOT NULL DEFAULT 'monthly',
        \`effective_from\` DATE NOT NULL,
        \`effective_until\` DATE NULL,
        \`note\`           TEXT NULL,
        \`created_by\`     INT NULL,
        \`created_at\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_feeconfig_lookup\` (\`class_id\`, \`grade_level\`, \`fee_type\`),
        FOREIGN KEY (\`class_id\`) REFERENCES \`classrooms\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 2: invoices
    console.log('  + Tạo bảng invoices...');
    await conn.query(`
      CREATE TABLE \`invoices\` (
        \`id\`              INT NOT NULL AUTO_INCREMENT,
        \`student_id\`      INT NOT NULL,
        \`month\`           CHAR(7) NOT NULL,
        \`subtotal_amount\`  DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`discount_amount\`  DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`refund_amount\`    DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`total_amount\`     DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`amount_paid\`      DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`status\`           ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
        \`due_date\`         DATE NOT NULL,
        \`paid_at\`          DATETIME NULL,
        \`note\`             TEXT NULL,
        \`created_by\`       INT NULL,
        \`created_at\`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_invoice_student_month\` (\`student_id\`, \`month\`),
        INDEX \`IDX_invoice_status_month\` (\`status\`, \`month\`),
        FOREIGN KEY (\`student_id\`) REFERENCES \`students\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 3: invoice_items
    console.log('  + Tạo bảng invoice_items...');
    await conn.query(`
      CREATE TABLE \`invoice_items\` (
        \`id\`             INT NOT NULL AUTO_INCREMENT,
        \`invoice_id\`     INT NOT NULL,
        \`fee_config_id\`  INT NULL,
        \`name\`           VARCHAR(255) NOT NULL,
        \`type\`           ENUM('tuition', 'meal_expected', 'meal_refund', 'facility', 'transport', 'extracurricular', 'other') NOT NULL,
        \`unit_price\`     DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`quantity\`       INT NOT NULL DEFAULT 1,
        \`subtotal\`       DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`discount\`       DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`total_amount\`   DECIMAL(12,0) NOT NULL DEFAULT 0,
        \`note\`           TEXT NULL,
        \`created_at\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_item_invoice\` (\`invoice_id\`),
        FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`fee_config_id\`) REFERENCES \`fee_configs\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 4: payments
    console.log('  + Tạo bảng payments...');
    await conn.query(`
      CREATE TABLE \`payments\` (
        \`id\`             INT NOT NULL AUTO_INCREMENT,
        \`invoice_id\`     INT NOT NULL,
        \`amount\`         DECIMAL(12,0) NOT NULL,
        \`payment_method\` ENUM('cash', 'bank_transfer', 'card', 'momo', 'other') NOT NULL DEFAULT 'bank_transfer',
        \`reference_code\` VARCHAR(150) NULL,
        \`paid_at\`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`received_by\`    INT NULL,
        \`note\`           TEXT NULL,
        \`created_at\`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_payment_invoice\` (\`invoice_id\`),
        UNIQUE KEY \`UQ_payment_reference\` (\`reference_code\`),
        FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Table 5: invoice_batches
    console.log('  + Tạo bảng invoice_batches...');
    await conn.query(`
      CREATE TABLE \`invoice_batches\` (
        \`id\`              INT NOT NULL AUTO_INCREMENT,
        \`month\`           CHAR(7) NOT NULL,
        \`status\`          ENUM('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
        \`total_records\`   INT NOT NULL DEFAULT 0,
        \`success_records\` INT NOT NULL DEFAULT 0,
        \`error_log\`       TEXT NULL,
        \`created_by\`      INT NULL,
        \`created_at\`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`completed_at\`    DATETIME NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_batch_month\` (\`month\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Seed development data
    console.log('[4/4] Đang gieo dữ liệu mẫu (Seed)...');
    
    // Seed fee_configs
    console.log('  + Seed fee_configs...');
    const [fc1] = await conn.query(`
      INSERT INTO \`fee_configs\` (\`class_id\`, \`grade_level\`, \`fee_type\`, \`name\`, \`amount\`, \`billing_cycle\`, \`effective_from\`, \`created_by\`) VALUES
      (NULL, NULL, 'tuition', 'Học phí cơ bản', 1500000, 'monthly', '2026-04-01', 1),
      (NULL, NULL, 'meal', 'Tiền ăn hàng ngày', 25000, 'daily', '2026-04-01', 1),
      (NULL, NULL, 'facility', 'Phí cơ sở vật chất Q2/2026', 200000, 'one_time', '2026-04-01', 1)
    `);
    const feeConfigIdTuition = fc1.insertId;
    const feeConfigIdMeal = fc1.insertId + 1;
    const feeConfigIdFacility = fc1.insertId + 2;

    // Student 1: Lê Quốc Duy
    const [inv1] = await conn.query(`
      INSERT INTO \`invoices\` (\`student_id\`, \`month\`, \`subtotal_amount\`, \`discount_amount\`, \`refund_amount\`, \`total_amount\`, \`amount_paid\`, \`status\`, \`due_date\`, \`created_by\`) VALUES
      (1, '2026-04', 2250000, 0, 0, 2250000, 1700000, 'partial', '2026-04-15', 1)
    `);
    await conn.query(`
      INSERT INTO \`invoice_items\` (\`invoice_id\`, \`fee_config_id\`, \`name\`, \`type\`, \`unit_price\`, \`quantity\`, \`subtotal\`, \`discount\`, \`total_amount\`, \`note\`) VALUES
      (${inv1.insertId}, ${feeConfigIdTuition}, 'Học phí cơ bản', 'tuition', 1500000, 1, 1500000, 0, 1500000, NULL),
      (${inv1.insertId}, ${feeConfigIdMeal}, 'Tiền ăn tạm tính', 'meal_expected', 25000, 22, 550000, 0, 550000, 'Tạm thu 22 ngày ăn'),
      (${inv1.insertId}, ${feeConfigIdFacility}, 'Phí cơ sở vật chất Q2/2026', 'facility', 200000, 1, 200000, 0, 200000, NULL)
    `);
    await conn.query(`
      INSERT INTO \`payments\` (\`invoice_id\`, \`amount\`, \`payment_method\`, \`reference_code\`, \`paid_at\`, \`received_by\`, \`note\`) VALUES
      (${inv1.insertId}, 1700000, 'bank_transfer', 'REF-LPQD042026', '2026-04-10 09:30:00', 1, 'Đóng tiền học kì')
    `);

    // Student 2: Nguyễn Thị Mai
    const [inv2] = await conn.query(`
      INSERT INTO \`invoices\` (\`student_id\`, \`month\`, \`subtotal_amount\`, \`discount_amount\`, \`refund_amount\`, \`total_amount\`, \`amount_paid\`, \`status\`, \`due_date\`, \`created_by\`) VALUES
      (2, '2026-04', 2250000, 0, 0, 2250000, 0, 'pending', '2026-04-15', 1)
    `);
    await conn.query(`
      INSERT INTO \`invoice_items\` (\`invoice_id\`, \`fee_config_id\`, \`name\`, \`type\`, \`unit_price\`, \`quantity\`, \`subtotal\`, \`discount\`, \`total_amount\`, \`note\`) VALUES
      (${inv2.insertId}, ${feeConfigIdTuition}, 'Học phí cơ bản', 'tuition', 1500000, 1, 1500000, 0, 1500000, NULL),
      (${inv2.insertId}, ${feeConfigIdMeal}, 'Tiền ăn tạm tính', 'meal_expected', 25000, 22, 550000, 0, 550000, 'Tạm thu 22 ngày ăn'),
      (${inv2.insertId}, ${feeConfigIdFacility}, 'Phí cơ sở vật chất Q2/2026', 'facility', 200000, 1, 200000, 0, 200000, NULL)
    `);

    // Student 3: Trần Bảo Châu
    const [inv3] = await conn.query(`
      INSERT INTO \`invoices\` (\`student_id\`, \`month\`, \`subtotal_amount\`, \`discount_amount\`, \`refund_amount\`, \`total_amount\`, \`amount_paid\`, \`status\`, \`due_date\`, \`paid_at\`, \`created_by\`) VALUES
      (3, '2026-04', 2200000, 0, 0, 2200000, 2200000, 'paid', '2026-04-15', '2026-04-12 10:15:00', 1)
    `);
    await conn.query(`
      INSERT INTO \`invoice_items\` (\`invoice_id\`, \`fee_config_id\`, \`name\`, \`type\`, \`unit_price\`, \`quantity\`, \`subtotal\`, \`discount\`, \`total_amount\`, \`note\`) VALUES
      (${inv3.insertId}, ${feeConfigIdTuition}, 'Học phí cơ bản', 'tuition', 1500000, 1, 1500000, 0, 1500000, NULL),
      (${inv3.insertId}, ${feeConfigIdMeal}, 'Tiền ăn tạm tính', 'meal_expected', 25000, 20, 500000, 0, 500000, 'Tạm thu 20 ngày ăn'),
      (${inv3.insertId}, ${feeConfigIdFacility}, 'Phí cơ sở vật chất Q2/2026', 'facility', 200000, 1, 200000, 0, 200000, NULL)
    `);
    await conn.query(`
      INSERT INTO \`payments\` (\`invoice_id\`, \`amount\`, \`payment_method\`, \`reference_code\`, \`paid_at\`, \`received_by\`, \`note\`) VALUES
      (${inv3.insertId}, 2200000, 'bank_transfer', 'REF-TBC042026', '2026-04-12 10:15:00', 1, 'Đóng học phí qua NH')
    `);

    // Student 4: Hoàng Long
    const [inv4] = await conn.query(`
      INSERT INTO \`invoices\` (\`student_id\`, \`month\`, \`subtotal_amount\`, \`discount_amount\`, \`refund_amount\`, \`total_amount\`, \`amount_paid\`, \`status\`, \`due_date\`, \`created_by\`) VALUES
      (4, '2026-04', 2250000, 0, 0, 2250000, 0, 'pending', '2026-04-15', 1)
    `);
    await conn.query(`
      INSERT INTO \`invoice_items\` (\`invoice_id\`, \`fee_config_id\`, \`name\`, \`type\`, \`unit_price\`, \`quantity\`, \`subtotal\`, \`discount\`, \`total_amount\`, \`note\`) VALUES
      (${inv4.insertId}, ${feeConfigIdTuition}, 'Học phí cơ bản', 'tuition', 1500000, 1, 1500000, 0, 1500000, NULL),
      (${inv4.insertId}, ${feeConfigIdMeal}, 'Tiền ăn tạm tính', 'meal_expected', 25000, 22, 550000, 0, 550000, 'Tạm thu 22 ngày ăn'),
      (${inv4.insertId}, ${feeConfigIdFacility}, 'Phí cơ sở vật chất Q2/2026', 'facility', 200000, 1, 200000, 0, 200000, NULL)
    `);

    // 5. Re-enable Foreign Key Checks
    console.log('[*] Kích hoạt lại kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 1)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n=========================================');
    console.log('✅ DATABASE FINANCE CẬP NHẬT THÀNH CÔNG!');
    console.log('=========================================');
    
  } catch (err) {
    console.error('\n❌ LỖI TRONG TIẾN TRÌNH CẬP NHẬT DB:', err.message);
  } finally {
    if (conn) {
      await conn.end();
      console.log('Đã đóng kết nối database.');
    }
  }
}

run().catch(console.error);
