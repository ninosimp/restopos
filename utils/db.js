import mysql from 'mysql2';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 4000,
  ssl: {
    rejectUnauthorized: false // สำคัญมากสำหรับ TiDB Cloud
  }
};

export const mysqlPool = mysql.createPool(dbConfig);