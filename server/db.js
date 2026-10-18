import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "teamzero_portal",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database:", process.env.DB_NAME || "teamzero_portal");
    connection.release();
    return true;
  } catch (error) {
    console.error("MySQL connection error:", error.message);
    return false;
  }
}

export default pool;
