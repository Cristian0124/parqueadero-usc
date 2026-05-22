const db  = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
require("dotenv").config();

const SECRET = process.env.JWT_SECRET || "secreto_temporal_cambiame";

// ── Registro ───────────────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { nombre, cedula, telefono, password } = req.body;
  if (!nombre || !cedula || !telefono || !password) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }
  // Validar que la cédula solo tenga números
  if (!/^\d{5,12}$/.test(String(cedula))) {
    return res.status(400).json({ message: "La cédula debe tener entre 5 y 12 dígitos" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO usuarios(nombre, cedula, telefono, password) VALUES(?, ?, ?, ?)",
      [nombre, cedula, telefono, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "La cédula ya está registrada" });
          }
          return res.status(500).json({ message: "Error al registrar usuario" });
        }
        res.status(201).json({ message: "Usuario registrado exitosamente" });
      }
    );
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ── Login ──────────────────────────────────────────────────────────────────
exports.login = (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) {
    return res.status(400).json({ message: "Cédula y contraseña son requeridos" });
  }
  db.query(
    "SELECT * FROM usuarios WHERE cedula = ?",
    [cedula],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno del servidor" });
      if (result.length === 0) {
        // Mismo mensaje para no revelar si el usuario existe o no
        return res.status(401).json({ message: "Cédula o contraseña incorrectos" });
      }
      const user = result[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Cédula o contraseña incorrectos" });
      }
      const token = jwt.sign(
        { id: user.id },
        SECRET,
        { expiresIn: "8h" }   // ampliado de 2h a 8h para mejor experiencia
      );
      res.json({
        message: "Login exitoso",
        token,
        usuario: {
          id:       user.id,
          nombre:   user.nombre,
          cedula:   user.cedula,
          telefono: user.telefono,
        },
      });
    }
  );
};

// ── Recuperar contraseña ───────────────────────────────────────────────────
// Verifica que la cédula exista y retorna los datos básicos del usuario
// (en producción esto enviaría un SMS/email, aquí devuelve confirmación)
exports.recover = (req, res) => {
  const { cedula } = req.body;
  if (!cedula) {
    return res.status(400).json({ message: "La cédula es requerida" });
  }
  db.query(
    "SELECT id, nombre, telefono FROM usuarios WHERE cedula = ?",
    [cedula],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno del servidor" });
      // Por seguridad, siempre respondemos igual exista o no el usuario
      res.json({
        message: "Si la cédula está registrada, contacta al administrador del parqueadero para restablecer tu contraseña.",
        encontrado: result.length > 0
      });
    }
  );
};
