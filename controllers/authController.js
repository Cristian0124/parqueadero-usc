const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.register = async (req, res) => {
  const { nombre, cedula, telefono, password } = req.body;
  if (!nombre || !cedula || !telefono || !password) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO usuarios(nombre, cedula, telefono, password) VALUES(?, ?, ?, ?)",
      [nombre, cedula, telefono, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "La cedula ya esta registrada" });
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

exports.login = (req, res) => {
  const { cedula, password } = req.body;
  if (!cedula || !password) {
    return res.status(400).json({ message: "Cedula y contrasena son requeridos" });
  }
  db.query(
    "SELECT * FROM usuarios WHERE cedula = ?",
    [cedula],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno del servidor" });
      if (result.length === 0) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      const user = result[0];
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Contrasena incorrecta" });
      }
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "secreto",
        { expiresIn: "2h" }
      );
      res.json({
        message: "Login exitoso",
        token,
        usuario: {
          id: user.id,
          nombre: user.nombre,
          cedula: user.cedula,
          telefono: user.telefono,
        },
      });
    }
  );
};
