const mysql = require("mysql2");
require("dotenv").config();

const isRailway = !!process.env.DATABASE_URL;

const pool = isRailway
  ? (() => {
      const url = new URL(process.env.DATABASE_URL);

      return mysql.createPool({
        host: url.hostname,
        port: url.port,
        user: url.username,
        password: url.password,
        database: url.pathname.replace("/", ""),
        ssl: { rejectUnauthorized: false },
        waitForConnections: true,
        connectionLimit: 10,
      });
    })()
  : mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "parqueadero_usc",
      waitForConnections: true,
      connectionLimit: 10,
    });

pool.getConnection((err, connection) => {
  if (err) {
    console.error("Error conectando a la base de datos:", err.message);
    process.exit(1);
  }
  console.log(`Base de datos conectada ${isRailway ? "(Railway)" : "(local)"}`);
  connection.release();
});

module.exports = pool;