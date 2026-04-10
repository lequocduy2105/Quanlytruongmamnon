const mysql = require('mysql2/promise');

async function run() {
  try {
    const connection = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });
    await connection.query('CREATE DATABASE IF NOT EXISTS kindergarten_db');
    console.log('Database created/verified.');
    process.exit(0);
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }
}
run();
