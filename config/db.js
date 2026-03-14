const mysql = require("mysql2");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "parqueadero_usc",
  port: parseInt(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
};

if (process.env.DB_SSL === "true") {
  dbConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(dbConfig);

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
    console.error("   Host:", process.env.DB_HOST);
    console.error("   Puerto:", process.env.DB_PORT);
    console.error("   Usuario:", process.env.DB_USER);
    console.error("   BD:", process.env.DB_NAME);
    process.exit(1);
  } else {
    console.log("✅ Base de datos conectada exitosamente");
    connection.release();
  }
});

module.exports = pool;
