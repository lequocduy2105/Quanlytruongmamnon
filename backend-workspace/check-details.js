const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '123456',
    database: 'kindergarten_db'
  });
  const [classrooms] = await conn.execute('SELECT * FROM classrooms');
  console.log("ALL CLASSROOMS DETAILS:", classrooms);
  const [students] = await conn.execute('SELECT * FROM students');
  console.log("ALL STUDENTS DETAILS:", students);
  await conn.end();
}
run().catch(console.error);
