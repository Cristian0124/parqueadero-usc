const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "parqueadero_usc",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Error conectando a la base de datos:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Base de datos conectada");
  }
});

module.exports = db;
