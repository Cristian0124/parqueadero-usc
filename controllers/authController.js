const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO usuarios(nombre, email, password) VALUES(?, ?, ?)",
      [nombre, email, hashedPassword],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "El email ya está registrado" });
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son requeridos" });
  }

  db.query(
    "SELECT * FROM usuarios WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno del servidor" });

      if (result.length === 0) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      const user = result[0];
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ message: "Contraseña incorrecta" });
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
          email: user.email,
        },
      });
    }
  );
};
