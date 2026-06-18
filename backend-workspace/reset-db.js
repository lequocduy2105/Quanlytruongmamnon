const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
  console.log('=== KHỞI ĐỘNG TIẾN TRÌNH DỌN DẸP DATABASE DIỆN RỘNG ===');
  
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
    
    // 1. Tắt Foreign Key Checks để thực hiện Truncate an toàn
    console.log('\n[1/5] Vô hiệu hóa kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 0)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // 2. Lấy danh sách toàn bộ các bảng trong database
    console.log('\n[2/5] Đang quét danh sách bảng trong database...');
    const [rows] = await conn.query('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);
    console.log(`  + Đã tìm thấy ${tables.length} bảng.`);
    
    // 3. Truncate toàn bộ các bảng vừa quét được
    console.log('\n[3/5] Đang dọn dẹp toàn bộ dữ liệu (Truncate)...');
    for (const table of tables) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
        console.log(`  + Đã dọn dẹp bảng: ${table}`);
      } catch (err) {
        console.warn(`  - Cảnh báo: Không thể dọn dẹp bảng ${table}: ${err.message}`);
      }
    }
    
    // 4. Tạo tài khoản Admin duy nhất để đăng nhập
    console.log('\n[4/5] Đang tạo tài khoản quản trị ADMIN duy nhất...');
    const passwordHash = await bcrypt.hash('PASSWORD123', 10);
    const [adminResult] = await conn.query(
      "INSERT INTO `users` (`email`, `password_hash`, `role`) VALUES (?, ?, 'ADMIN')",
      ['admin', passwordHash]
    );
    console.log(`  + Đã tạo tài khoản quản trị mới: email/username = 'admin', password = 'PASSWORD123' (ID: ${adminResult.insertId})`);
    
    // 5. Bật lại Foreign Key Checks
    console.log('\n[5/5] Kích hoạt lại kiểm tra khóa ngoại (FOREIGN_KEY_CHECKS = 1)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('\n=========================================');
    console.log('✅ QUÉT SẠCH DỮ LIỆU & RESET DATABASE THÀNH CÔNG!');
    console.log('Hệ thống trống trơn, chỉ còn duy nhất tài khoản admin.');
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
