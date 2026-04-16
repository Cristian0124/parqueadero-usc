const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const vehiculoRoutes = require("./routes/vehiculoRoutes");
const parqueoRoutes = require("./routes/parqueoRoutes");
const reservaRoutes = require("./routes/reservaRoutes");
const db = require("./config/db");

const app = express();

// 🔥 Healthcheck (MUY IMPORTANTE - poner arriba)
const path = require("path");

// HOME (frontend principal)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

// MAPA (nueva vista)
app.get("/mapa", (req, res) => {
  res.sendFile(path.join(__dirname, "mapa.html"));
});

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/parqueos", parqueoRoutes);
app.use("/api/reservas", reservaRoutes);

// ── Cron: cancelar reservas expiradas cada 5 minutos ──────
setInterval(() => {
  db.query(
    "UPDATE reservas SET estado = 'expirada' WHERE estado = 'activa' AND expira_en < NOW()",
    (err, result) => {
      if (!err && result.affectedRows > 0) {
        console.log(`${result.affectedRows} reserva(s) expirada(s) canceladas`);
      }
    }
  );
}, 5 * 60 * 1000);

// Servir frontend (opcional)
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
