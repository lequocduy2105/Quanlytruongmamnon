const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({host: 'localhost', user: 'root', password: '123456', database: 'kindergarten_db'});
  const [students_in_class_3] = await conn.execute('SELECT * FROM students WHERE class_id = 3');
  console.log("Students in Class 3:", students_in_class_3);
  const [student_3] = await conn.execute('SELECT * FROM students WHERE id = 3');
  console.log("Student ID 3:", student_3);
  await conn.end();
}
run().catch(console.error);
