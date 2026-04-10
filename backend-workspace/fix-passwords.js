const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixPaswords() {
  console.log("Connecting to DB...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kindergarten_db',
    port: process.env.DB_PORT || 3306
  });

  const hash = await bcrypt.hash('password123', 10);
  console.log("Updating all passwords to password123...");
  await connection.execute('UPDATE users SET password_hash = ?', [hash]);
  console.log("Passwords updated successfully!");
  
  await connection.end();
}

fixPaswords().catch(console.error);
