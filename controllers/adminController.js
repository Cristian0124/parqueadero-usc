const db     = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt    = require("jsonwebtoken");
require("dotenv").config();

const SECRET       = process.env.JWT_SECRET || "secreto_temporal_cambiame";
const ADMIN_SECRET = process.env.ADMIN_SECRET || "admin_usc_2024";

// ── Registrar administrador ────────────────────────────────────────────────
exports.registrarAdmin = async (req, res) => {
  const { nombre, email, password, codigo_secreto } = req.body;

  if (!nombre || !email || !password || !codigo_secreto) {
    return res.status(400).json({ message: "Todos los campos son requeridos" });
  }
  if (codigo_secreto !== ADMIN_SECRET) {
    return res.status(403).json({ message: "Código secreto incorrecto" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Email inválido" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      "INSERT INTO administradores (nombre, email, password) VALUES (?, ?, ?)",
      [nombre, email, hash],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Este email ya está registrado" });
          }
          return res.status(500).json({ message: "Error al registrar administrador" });
        }
        res.status(201).json({ message: "Administrador registrado exitosamente" });
      }
    );
  } catch (e) {
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ── Login administrador ────────────────────────────────────────────────────
exports.loginAdmin = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email y contraseña son requeridos" });
  }
  db.query(
    "SELECT * FROM administradores WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const admin = result[0];
      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ message: "Credenciales incorrectas" });
      }
      const token = jwt.sign(
        { id: admin.id, rol: "admin" },
        SECRET,
        { expiresIn: "8h" }
      );
      res.json({
        message: "Login exitoso",
        token,
        admin: { id: admin.id, nombre: admin.nombre, email: admin.email }
      });
    }
  );
};

// ── Ver todas las reservas activas ─────────────────────────────────────────
exports.reservasActivas = (req, res) => {
  db.query(
    `SELECT r.id, r.tipo, r.placa, r.puesto, r.estado,
            r.fecha_reserva, r.expira_en, r.hora_salida, r.creado_en,
            u.nombre AS usuario_nombre, u.cedula AS usuario_cedula, u.telefono AS usuario_telefono
     FROM reservas r
     JOIN usuarios u ON r.usuario_id = u.id
     WHERE r.estado = 'activa'
     ORDER BY r.fecha_reserva DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener reservas" });
      res.json(result);
    }
  );
};

// ── Historial completo de todos los usuarios ───────────────────────────────
exports.historialCompleto = (req, res) => {
  const limit  = parseInt(req.query.limit)  || 50;
  const offset = parseInt(req.query.offset) || 0;
  const filtro = req.query.estado || null;

  const where = filtro ? "WHERE r.estado = ?" : "";
  const params = filtro ? [filtro, limit, offset] : [limit, offset];

  db.query(
    `SELECT r.id, r.tipo, r.placa, r.puesto, r.estado,
            r.fecha_reserva, r.expira_en, r.hora_salida, r.creado_en,
            u.nombre AS usuario_nombre, u.cedula AS usuario_cedula
     FROM reservas r
     JOIN usuarios u ON r.usuario_id = u.id
     ${where}
     ORDER BY r.creado_en DESC
     LIMIT ? OFFSET ?`,
    params,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener historial" });
      res.json(result);
    }
  );
};

// ── Cancelar cualquier reserva ─────────────────────────────────────────────
exports.cancelarReservaAdmin = (req, res) => {
  const { id } = req.params;
  db.query(
    "SELECT * FROM reservas WHERE id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) return res.status(404).json({ message: "Reserva no encontrada" });
      if (result[0].estado !== "activa") {
        return res.status(409).json({ message: "La reserva no está activa" });
      }
      db.query(
        "UPDATE reservas SET estado = 'cancelada', hora_salida = NOW() WHERE id = ?",
        [id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Error al cancelar" });
          res.json({ message: "Reserva cancelada correctamente" });
        }
      );
    }
  );
};

// ── Obtener todos los espacios ─────────────────────────────────────────────
exports.obtenerEspacios = (req, res) => {
  db.query(
    `SELECT e.id, e.tipo, e.capacidad_total,
            IFNULL(COUNT(r.id), 0) AS ocupados,
            (e.capacidad_total - IFNULL(COUNT(r.id), 0)) AS disponibles
     FROM espacios e
     LEFT JOIN reservas r ON r.tipo = e.tipo AND r.estado = 'activa'
     GROUP BY e.id, e.tipo, e.capacidad_total
     ORDER BY e.tipo`,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener espacios" });
      res.json(result);
    }
  );
};

// ── Actualizar capacidad de un espacio ─────────────────────────────────────
exports.actualizarEspacio = (req, res) => {
  const { id } = req.params;
  const { capacidad_total } = req.body;

  if (!capacidad_total || isNaN(capacidad_total) || capacidad_total < 1) {
    return res.status(400).json({ message: "La capacidad debe ser un número mayor a 0" });
  }

  // Verificar que la nueva capacidad no sea menor a los ocupados actuales
  db.query(
    `SELECT e.tipo,
            (SELECT COUNT(*) FROM reservas WHERE tipo = e.tipo AND estado = 'activa') AS ocupados
     FROM espacios e WHERE e.id = ?`,
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) return res.status(404).json({ message: "Espacio no encontrado" });

      if (capacidad_total < result[0].ocupados) {
        return res.status(409).json({
          message: `No puedes reducir la capacidad por debajo de los ${result[0].ocupados} espacios actualmente ocupados`
        });
      }

      db.query(
        "UPDATE espacios SET capacidad_total = ? WHERE id = ?",
        [capacidad_total, id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Error al actualizar" });
          res.json({ message: "Capacidad actualizada correctamente" });
        }
      );
    }
  );
};

// ── Estadísticas del dashboard ─────────────────────────────────────────────
exports.estadisticas = (req, res) => {
  db.query(
    `SELECT
       (SELECT COUNT(*) FROM reservas WHERE estado = 'activa')     AS activas,
       (SELECT COUNT(*) FROM reservas WHERE estado = 'completada') AS completadas,
       (SELECT COUNT(*) FROM reservas WHERE estado = 'cancelada')  AS canceladas,
       (SELECT COUNT(*) FROM reservas WHERE estado = 'expirada')   AS expiradas,
       (SELECT COUNT(*) FROM reservas WHERE DATE(creado_en) = CURDATE()) AS hoy,
       (SELECT COUNT(*) FROM usuarios)                             AS total_usuarios`,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener estadísticas" });
      res.json(result[0]);
    }
  );
};
