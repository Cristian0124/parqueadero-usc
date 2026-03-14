const express = require("express");
const router = express.Router();
const vehiculo = require("../controllers/vehiculoController");
const verifyToken = require("../middleware/verifyToken");

// autenticacion para vehiculos
router.get("/", verifyToken, vehiculo.obtenerVehiculos);
router.post("/", verifyToken, vehiculo.crearVehiculo);
router.delete("/:id", verifyToken, vehiculo.eliminarVehiculo);

module.exports = router;
