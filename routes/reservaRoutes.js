const express = require("express");
const router = express.Router();
const reserva = require("../controllers/reservaController");
const verifyToken = require("../middleware/verifyToken");

// Rutas protegidas
router.post("/", verifyToken, reserva.crearReserva);
router.get("/", verifyToken, reserva.obtenerReservas);
router.get("/espacios", verifyToken, reserva.obtenerEspacios);

// QR
router.post("/validar-entrada", verifyToken, reserva.validarQREntrada);
router.post("/salida-qr", verifyToken, reserva.registrarSalidaQR);

// mantenimiento
router.post("/cancelar-expiradas", reserva.cancelarExpiradas);

// NUEVA RUTA (CORRECTA)
router.get("/puestos", reserva.obtenerPuestosOcupados);
router.patch("/:id/cancelar", verifyToken, reserva.cancelarReserva);
module.exports = router;