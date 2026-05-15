const express    = require(“express”);
const cors       = require(“cors”);
const bodyParser = require(“body-parser”);
const rateLimit  = require(“express-rate-limit”);
require(“dotenv”).config();

const authRoutes    = require(”./routes/authRoutes”);
const vehiculoRoutes = require(”./routes/Rutas vehiculares”);
const parqueoRoutes  = require(”./routes/parqueoRoutes”);
const reservaRoutes  = require(”./routes/reservaRoutes”);
const adminRoutes    = require(”./routes/adminRoutes”);
const db = require(”./config/db”);
const path = require(“path”);

// ── Validar que JWT_SECRET esté configurado ────────────────────────────────
if (!process.env.JWT_SECRET) {
console.warn(“⚠️  ADVERTENCIA: JWT_SECRET no está configurado en las variables de entorno.”);
console.warn(”   Configura JWT_SECRET en Railway para mayor seguridad.”);
}

const app = express();

// ── CORS — solo permite peticiones desde tu dominio de Railway ─────────────
const dominiosPermitidos = [
/.railway.app$/,        // cualquier subdominio de railway.app
/^http://localhost/     // desarrollo local
];
app.use(cors({
origin: (origin, callback) => {
// Permite peticiones sin origin (apps móviles, Postman, curl)
if (!origin) return callback(null, true);
const permitido = dominiosPermitidos.some(patron => patron.test(origin));
if (permitido) return callback(null, true);
callback(new Error(“CORS: origen no permitido — “ + origin));
},
methods: [“GET”, “POST”, “PUT”, “PATCH”, “DELETE”],
allowedHeaders: [“Content-Type”, “Authorization”]
}));

app.use(bodyParser.json());

// ── Rate limiting — máximo 100 peticiones por IP cada 15 minutos ──────────
const limitadorGeneral = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100,
standardHeaders: true,
legacyHeaders: false,
message: { message: “Demasiadas peticiones. Espera unos minutos e intenta de nuevo.” }
});

// Rate limit más estricto para login y registro (20 intentos cada 15 min)
const limitadorAuth = rateLimit({
windowMs: 15 * 60 * 1000,
max: 20,
standardHeaders: true,
legacyHeaders: false,
message: { message: “Demasiados intentos de acceso. Espera 15 minutos.” }
});

app.use(limitadorGeneral);

// ── Healthcheck ────────────────────────────────────────────────────────────
app.get(”/health”, (req, res) => {
res.status(200).send(“OK”);
});

// ── Frontend principal ─────────────────────────────────────────────────────
app.get(”/”, (req, res) => {
res.sendFile(path.join(__dirname, “frontend.html”));
});

// ── Mapa ───────────────────────────────────────────────────────────────────
app.get(”/mapa”, (req, res) => {
res.sendFile(path.join(__dirname, “mapa.html”));
});

// ── Rutas API ──────────────────────────────────────────────────────────────
app.use(”/api/auth”,      limitadorAuth, authRoutes);
app.use(”/api/vehiculos”, vehiculoRoutes);
app.use(”/api/parqueos”,  parqueoRoutes);
app.use(”/api/reservas”,  reservaRoutes);
app.use(”/api/admin”,     adminRoutes);

// Panel de administrador
app.get(”/admin”, (req, res) => {
res.sendFile(path.join(__dirname, “admin.html”));
});

// ── Archivos estáticos ─────────────────────────────────────────────────────
app.use(express.static(__dirname));

// ── Cron: cancelar reservas expiradas cada 5 minutos ──────────────────────
setInterval(() => {
db.query(
“UPDATE reservas SET estado = ‘expirada’ WHERE estado = ‘activa’ AND expira_en < NOW()”,
(err, result) => {
if (!err && result.affectedRows > 0) {
console.log(${result.affectedRows} reserva(s) expirada(s) canceladas);
}
}
);
}, 5 * 60 * 1000);

// ── Arrancar servidor ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, “0.0.0.0”, () => {
console.log(✅ Servidor corriendo en puerto ${PORT});
});
