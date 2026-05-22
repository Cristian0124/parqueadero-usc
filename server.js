const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const vehiculoRoutes = require("./routes/vehiculoRoutes");
const parqueoRoutes = require("./routes/parqueoRoutes");
const reservaRoutes = require("./routes/reservaRoutes");
const adminRoutes = require("./routes/adminRoutes");
const db = require("./config/db");
const app = express();
app.use(cors());
app.use(bodyParser.json());
// Rate limit general
const limitadorGeneral = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100,
message: { message: "Demasiadas peticiones. Espera unos minutos." }
});
// Rate limit para auth
const limitadorAuth = rateLimit({
windowMs: 15 * 60 * 1000,
max: 20,
message: { message: "Demasiados intentos. Espera 15 minutos." }
});
app.use(limitadorGeneral);
// Healthcheck
app.get("/health", (req, res) => res.status(200).send("OK"));
// Panel de administrador
app.get("/admin", (req, res) => {
res.sendFile(path.join(__dirname, "admin.html"));
});
// Frontend principal
app.get("/", (req, res) => {
res.sendFile(path.join(__dirname, "frontend.html"));
});
// Mapa
app.get("/mapa", (req, res) => {
res.sendFile(path.join(__dirname, "mapa.html"));
});
// Rutas API
app.use("/api/auth", limitadorAuth, authRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/parqueos", parqueoRoutes);
app.use("/api/reservas", reservaRoutes);
app.use("/api/admin", adminRoutes);
// Archivos estáticos
app.use(express.static(__dirname));
// Cron: cancelar reservas expiradas cada 5 minutos
setInterval(() => {
db.query(
"UPDATE reservas SET estado = 'expirada' WHERE estado = 'pendiente' AND expira_en < NOW()",
(err, result) => {
if (!err && result.affectedRows > 0) {
console.log(`${result.affectedRows} reserva(s) expirada(s)`);
}
}
);
}, 5 * 60 * 1000);
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
console.log(`Servidor corriendo en puerto ${PORT}`);
});