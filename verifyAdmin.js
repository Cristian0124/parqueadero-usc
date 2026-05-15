const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "secreto_temporal_cambiame";

function verifyAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(403).json({ message: "Token de administrador requerido" });
  }
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Sesión expirada. Inicia sesión de nuevo." });
      }
      return res.status(401).json({ message: "Token inválido" });
    }
    if (decoded.rol !== "admin") {
      return res.status(403).json({ message: "Acceso restringido a administradores" });
    }
    req.adminId = decoded.id;
    next();
  });
}

module.exports = verifyAdmin;
