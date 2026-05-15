const express     = require("express");
const router      = express.Router();
const admin       = require("../controllers/adminController");
const verifyAdmin = require("../middleware/verifyAdmin");

// Autenticación (rutas públicas del admin)
router.post("/register", admin.registrarAdmin);
router.post("/login",    admin.loginAdmin);

// Rutas protegidas — requieren token de admin
router.get ("/reservas/activas",       verifyAdmin, admin.reservasActivas);
router.get ("/reservas/historial",     verifyAdmin, admin.historialCompleto);
router.patch("/reservas/:id/cancelar", verifyAdmin, admin.cancelarReservaAdmin);
router.get ("/espacios",               verifyAdmin, admin.obtenerEspacios);
router.patch("/espacios/:id",          verifyAdmin, admin.actualizarEspacio);
router.get ("/estadisticas",           verifyAdmin, admin.estadisticas);

module.exports = router;
