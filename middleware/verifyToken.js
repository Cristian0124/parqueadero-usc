const jwt = require("jsonwebtoken");
require("dotenv").config();

function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(403).json({ message: "Token requerido" });
  }

  // Soporta formato: "Bearer <token>"
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  jwt.verify(token, process.env.JWT_SECRET || "secreto", (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.userId = decoded.id;
    next();
  });
}

module.exports = verifyToken;
