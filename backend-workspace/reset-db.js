const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('=== KHỞI ĐỘNG TIẾN TRÌNH DỌN DẸP DATABASE ===');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kindergarten_db',
  };

  console.log(`Đang kết nối tới DB: ${config.host}:${config.port}/${config.database} (User: ${config.user})...`);
  
  let conn;
  try {
    conn = await mysql.createConnection(config);
    
    // 1. Tắt Foreign Key Checks để thực hiện Truncate/Delete an toàn
    console.log('\n[1/5] Vô hiệu hóa kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 0)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 2. Truncate các bảng dữ liệu phát sinh (test data) và các danh mục tĩnh (Master Data)
    const tablesToTruncate = [
      'activity_logs',
      'attendance',
      'authorized_pickups',
      'classrooms',
      'daily_menus',
      'fee_configs',
      'feedbacks',
      'health_records',
      'incident_reports',
      'invoices',
      'leave_requests',
      'lesson_contents',
      'medication_logs',
      'medication_schedules',
      'notifications',
      'payments',
      'skill_assessments',
      'students',
      'support_tickets',
      'teachers'
    ];
    
    console.log('\n[2/5] Đang dọn dẹp toàn bộ dữ liệu nghiệp vụ & danh mục lớp học, học phí (Truncate)...');
    for (const table of tablesToTruncate) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  + Đã dọn dẹp bảng: ${table}`);
      } catch (err) {
        console.warn(`  - Cảnh báo: Không thể dọn dẹp bảng ${table}: ${err.message}`);
      }
    }
    
    // 3. Dọn dẹp bảng users, chỉ giữ lại tài khoản ADMIN
    console.log('\n[3/5] Đang dọn dẹp bảng users (chỉ giữ lại tài khoản ADMIN)...');
    const [userDeleteResult] = await conn.query("DELETE FROM `users` WHERE `role` != 'ADMIN'");
    console.log(`  + Đã xóa ${userDeleteResult.affectedRows} tài khoản (Teacher, Parent).`);
    
    // Reset AUTO_INCREMENT của users về giá trị an toàn (max id + 1)
    const [maxIdRows] = await conn.query('SELECT MAX(id) AS maxId FROM users');
    const nextAutoIncrement = (maxIdRows[0].maxId || 0) + 1;
    await conn.query(`ALTER TABLE \`users\` AUTO_INCREMENT = ${nextAutoIncrement}`);
    console.log(`  + Reset AUTO_INCREMENT cho bảng users về: ${nextAutoIncrement}`);

    // 4. Bật lại Foreign Key Checks
    console.log('\n[4/5] Kích hoạt lại kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 1)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n=========================================');
    console.log('✅ DỌN DẸP DATABASE THÀNH CÔNG!');
    console.log('Hệ thống đã sẵn sàng cho kiểm thử End-to-End từ DB sạch.');
    console.log('=========================================');
    
  } catch (err) {
    console.error('\n❌ LỖI TRONG TIẾN TRÌNH DỌN DẸP DB:', err.message);
  } finally {
    if (conn) {
      await conn.end();
      console.log('Đã đóng kết nối database.');
    }
  }
}

run().catch(console.error);
