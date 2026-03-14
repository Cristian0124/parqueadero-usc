const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const vehiculoRoutes = require("./routes/vehiculoRoutes");
const parqueoRoutes = require("./routes/parqueoRoutes");

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
// Railway requiere escuchar en 0.0.0.0, no solo en localhost
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || "desarrollo"}`);
});
