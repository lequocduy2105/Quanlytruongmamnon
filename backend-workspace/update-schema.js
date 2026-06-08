const mysql = require('mysql2/promise');

async function run() {
  const config = {
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'kindergarten_db'
  };

  let conn;
  try {
    conn = await mysql.createConnection(config);
    console.log('--- Đang cập nhật Database Schema ---');

    const addColumn = async (table, col, definition) => {
      try {
        await conn.execute(`ALTER TABLE ${table} ADD COLUMN ${col} ${definition}`);
        console.log(`+ Đã thêm cột ${col} vào bảng ${table}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`- Cột ${col} đã tồn tại trong bảng ${table}`);
        } else {
          console.error(`❌ Lỗi khi thêm cột ${col}:`, e.message);
        }
      }
    };

    const addIndex = async (table, indexName, columns) => {
      try {
        await conn.execute(`ALTER TABLE ${table} ADD INDEX ${indexName} (${columns})`);
        console.log(`+ Đã thêm index ${indexName} vào bảng ${table} (${columns})`);
      } catch (e) {
        if (e.code === 'ER_DUP_KEYNAME') {
          console.log(`- Index ${indexName} đã tồn tại trong bảng ${table}`);
        } else {
          console.error(`❌ Lỗi khi thêm index ${indexName}:`, e.message);
        }
      }
    };

    // 1. Cập nhật bảng students
    console.log('\n--- Kiểm tra bảng students ---');
    await addColumn('students', 'status', "VARCHAR(20) DEFAULT 'active'");
    await addColumn('students', 'withdrawal_reason', "TEXT DEFAULT NULL");
    await addColumn('students', 'is_special_needs', "BOOLEAN DEFAULT FALSE");
    await addIndex('students', 'idx_students_fullname_dob', 'full_name, date_of_birth');

    // 2. Cập nhật bảng classrooms
    console.log('\n--- Kiểm tra bảng classrooms ---');
    await addColumn('classrooms', 'grade_level', "VARCHAR(10) DEFAULT NULL");
    await addColumn('classrooms', 'academic_year', "VARCHAR(9) DEFAULT NULL");
    await addColumn('classrooms', 'status', "VARCHAR(20) DEFAULT 'active'");

    // 3. Cập nhật bảng teachers
    console.log('\n--- Kiểm tra bảng teachers ---');
    await addColumn('teachers', 'is_active', "TINYINT NOT NULL DEFAULT 1");

    // 4. Cập nhật bảng skill_assessments (QUAN TRỌNG CHO LỖI 500)
    console.log('\n--- Kiểm tra bảng skill_assessments ---');
    await addColumn('skill_assessments', 'deficiency_log', "TEXT DEFAULT NULL");

    console.log('\n✅ Cập nhật Database Schema hoàn tất!');
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

run();
