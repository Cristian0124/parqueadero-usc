const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./rutas/authRoutes");
const vehiculoRoutes = require("./rutas/vehiculoRoutes");
const parqueoRoutes = require("./rutas/parqueoRoutes");

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/vehiculos", vehiculoRoutes);
app.use("/api/parqueos", parqueoRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "🚗 API Parqueadero USC funcionando" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "desarrollo"}`);
});
