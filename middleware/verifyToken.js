const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET;

if (!SECRET) {
  console.warn("⚠️  verifyToken: JWT_SECRET no configurado. Configúralo en Railway.");
}

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "Token requerido" });
  }

  // Soporta formato: "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  jwt.verify(token, SECRET || "secreto_temporal_cambiame", (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Sesión expirada. Inicia sesión de nuevo." });
      }
      return res.status(401).json({ message: "Token inválido" });
    }
    req.userId = decoded.id;
    next();
  });
}

module.exports = verifyToken;
