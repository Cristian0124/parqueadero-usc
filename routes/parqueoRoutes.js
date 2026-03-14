const express = require("express");
const router = express.Router();
const parqueo = require("../controllers/parqueoController");
const verifyToken = require("../middleware/verifyToken");

// autenticacion de parqueadero
router.post("/entrada", verifyToken, parqueo.registrarEntrada);
router.post("/salida", verifyToken, parqueo.registrarSalida);
router.get("/", verifyToken, parqueo.obtenerParqueos);

module.exports = router;
