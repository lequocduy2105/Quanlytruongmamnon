const mysql = require('mysql2/promise');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
  console.log("Connecting to database...");
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'kindergarten_db',
    multipleStatements: true
  });

  try {
    console.log("Reading fix_all_db.sql...");
    const sql = fs.readFileSync('fix_all_db.sql', 'utf8');
    
    console.log("Executing migration queries...");
    const [result] = await connection.query(sql);
    console.log("Database update completed successfully!");
  } catch (err) {
    console.error("Failed to run SQL migration:", err.message);
  } finally {
    await connection.end();
  }
}

run();
