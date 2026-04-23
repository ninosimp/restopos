import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "4000"),
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true // เปลี่ยนเป็น true เพื่อความปลอดภัยบน Cloud
  },
  waitForConnections: true,
  connectionLimit: 3, // ลดจำนวน Connection ลงบน Vercel
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

export const mysqlPool = mysql.createPool(dbConfig);