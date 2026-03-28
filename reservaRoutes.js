const express = require("express");
const router = express.Router();
const reserva = require("../controllers/reservaController");
const verifyToken = require("../middleware/verifyToken");

// Rutas protegidas (usuario autenticado)
router.post("/",                  verifyToken, reserva.crearReserva);
router.get("/",                   verifyToken, reserva.obtenerReservas);
router.get("/espacios",           verifyToken, reserva.obtenerEspacios);

// Validación QR (llamadas del parqueadero)
router.post("/validar-entrada",   verifyToken, reserva.validarQREntrada);
router.post("/salida-qr",         verifyToken, reserva.registrarSalidaQR);

// Mantenimiento interno
router.post("/cancelar-expiradas", reserva.cancelarExpiradas);

module.exports = router;
