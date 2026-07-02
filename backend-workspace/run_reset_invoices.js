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
    console.log("Reading reset_invoices_table.sql...");
    const sql = fs.readFileSync('reset_invoices_table.sql', 'utf8');
    
    console.log("Executing reset_invoices_table.sql...");
    await connection.query(sql);
    console.log("Invoices table reset completed successfully!");
  } catch (err) {
    console.error("Failed to run SQL reset:", err.message);
  } finally {
    await connection.end();
  }
}

run();
