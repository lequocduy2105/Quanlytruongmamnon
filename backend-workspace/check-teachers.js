const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'kindergarten_db'
  });
  const [users] = await conn.execute('SELECT id, email, role FROM users');
  console.log("USERS:", users);
  const [teachers] = await conn.execute('SELECT id, user_id, full_name, class_id FROM teachers');
  console.log("TEACHERS:", teachers);
  const [classrooms] = await conn.execute('SELECT id, name, teacher_id FROM classrooms');
  console.log("CLASSROOMS:", classrooms);
  const [students] = await conn.execute('SELECT id, full_name, class_id, status FROM students');
  console.log("STUDENTS:", students);
  await conn.end();
}
run().catch(console.error);

