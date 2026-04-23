import mysql from 'mysql2/promise'; // ใช้แบบ promise เพื่อความเสถียร

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "4000"),
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// สร้าง Pool ที่ใช้ซ้ำได้
export const mysqlPool = mysql.createPool(dbConfig);