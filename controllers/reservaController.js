const db = require("../config/db");
const crypto = require("crypto");
 
// ── Helpers ────────────────────────────────────────────────────────────────
 
function generarToken() {
  return "PQ-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}
 
// El QR expira 10 minutos después de creado si no se escanea
function calcularExpiracion(fechaReserva) {
  const d = new Date(fechaReserva);
  d.setMinutes(d.getMinutes() + 10);
  return d;
}
 
// ── Crear reserva ────────
exports.crearReserva = (req, res) => {
  const usuario_id = req.userId;
  const { tipo, placa, fecha_reserva, puesto } = req.body;
 
  if (!tipo || !fecha_reserva || !puesto) {
    return res.status(400).json({ message: "tipo, fecha_reserva y puesto son requeridos" });
  }
 
  // verificacion de reserva activa o pendiente
  db.query(
    "SELECT id FROM reservas WHERE usuario_id = ? AND estado IN ('activa', 'pendiente', 'ocupado')",
    [usuario_id],
    (err, activas) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (activas.length > 0) {
        return res.status(409).json({ message: "Ya tienes una reserva activa" });
      }
 
      // verificacion de puesto
      db.query(
        "SELECT id FROM reservas WHERE puesto = ? AND estado IN ('pendiente', 'ocupado')",
        [puesto],
        (err2, ocupados) => {
          if (err2) return res.status(500).json({ message: "Error interno" });
          if (ocupados.length > 0) {
            return res.status(409).json({ message: "Este puesto ya está ocupado" });
          }
 
          // verificacion de capacidad
          db.query(
            `SELECT capacidad_total,
            (SELECT COUNT(*) FROM reservas WHERE tipo = ? AND estado IN ('pendiente','ocupado')) AS ocupados
            FROM espacios WHERE tipo = ? LIMIT 1`,
            [tipo, tipo],
            (err3, espacios) => {
              if (err3) return res.status(500).json({ message: "Error al verificar espacios" });
              const espacio = espacios[0];
              if (espacio && espacio.ocupados >= espacio.capacidad_total) {
                return res.status(409).json({ message: "No hay espacios disponibles para " + tipo });
              }
 
              // crear reserva en estado 'pendiente'
              const qr_token = generarToken();
              const qr_salida_token = "SALIDA-" + generarToken();
              const expira_en = calcularExpiracion(fecha_reserva);
 
              db.query(
                `INSERT INTO reservas (usuario_id, tipo, placa, fecha_reserva, puesto, qr_token, qr_salida_token, expira_en, estado)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente')`,
                [usuario_id, tipo, placa || null, fecha_reserva, puesto, qr_token, qr_salida_token, expira_en],
                (err4, result) => {
                  if (err4) return res.status(500).json({ message: "Error al crear reserva" });
                  res.status(201).json({
                    message: "Reserva creada",
                    reserva: {
                      id: result.insertId,
                      tipo,
                      placa: placa || null,
                      fecha_reserva,
                      puesto,
                      qr_token,
                      qr_salida_token,
                      expira_en,
                      estado: "pendiente"
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};
 
// ── Obtener reservas del usuario ───────────────────────────────────────────
exports.obtenerReservas = (req, res) => {
  const usuario_id = req.userId;
  db.query(
    `SELECT * FROM reservas WHERE usuario_id = ? ORDER BY fecha_reserva DESC`,
    [usuario_id],
    (err, result) => {
      if (err) {
        console.error("ERROR REAL:", err);
        return res.status(500).json({ message: "Error al obtener reservas", error: err.message });
      }
      res.json(result);
    }
  );
};
 
// ── Validar QR de entrada (admin escanea → pendiente a ocupado) ──────────
exports.validarQREntrada = (req, res) => {
  const { qr_token } = req.body;
  if (!qr_token) return res.status(400).json({ message: "qr_token requerido" });
 
  db.query(
    `SELECT r.*, u.nombre, u.cedula FROM reservas r
     JOIN usuarios u ON r.usuario_id = u.id
     WHERE r.qr_token = ?`,
    [qr_token],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) return res.status(404).json({ message: "QR no encontrado" });
 
      const reserva = result[0];
 
      if (reserva.estado === "ocupado") {
        return res.status(409).json({ message: "Este QR ya fue escaneado, el puesto está ocupado" });
      }
      if (reserva.estado === "completada") {
        return res.status(409).json({ message: "Esta reserva ya fue finalizada" });
      }
      if (reserva.estado === "expirada" || reserva.estado === "cancelada") {
        return res.status(409).json({ message: "Esta reserva fue cancelada o expirada" });
      }
 
      // Verificar expiración
      if (new Date() > new Date(reserva.expira_en)) {
        db.query("UPDATE reservas SET estado = 'expirada' WHERE id = ?", [reserva.id]);
        return res.status(410).json({ message: "QR expirado. La reserva fue cancelada." });
      }
 
      // Cambiar estado a 'ocupado'
      db.query("UPDATE reservas SET estado = 'ocupado' WHERE id = ?", [reserva.id], (err2) => {
        if (err2) return res.status(500).json({ message: "Error al actualizar estado" });
        res.json({
          message: "QR válido ✓ — Puesto marcado como OCUPADO",
          reserva: {
            id: reserva.id,
            tipo: reserva.tipo,
            placa: reserva.placa,
            nombre: reserva.nombre,
            cedula: reserva.cedula,
            puesto: reserva.puesto,
            fecha_reserva: reserva.fecha_reserva
          }
        });
      });
    }
  );
};
 
// ── Registrar salida por QR (admin escanea → ocupado a completada) ────────
exports.registrarSalidaQR = (req, res) => {
  const { qr_salida_token } = req.body;
  if (!qr_salida_token) return res.status(400).json({ message: "qr_salida_token requerido" });
 
  db.query(
    "SELECT * FROM reservas WHERE qr_salida_token = ?",
    [qr_salida_token],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) return res.status(404).json({ message: "QR de salida no reconocido" });
 
      const reserva = result[0];
 
      if (reserva.estado === "completada") {
        return res.status(409).json({ message: "Esta reserva ya fue finalizada" });
      }
      if (reserva.estado === "pendiente") {
        return res.status(409).json({ message: "El usuario aún no ha entrado al parqueadero" });
      }
 
      db.query(
        "UPDATE reservas SET estado = 'completada', hora_salida = NOW() WHERE id = ?",
        [reserva.id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Error al registrar salida" });
          res.json({ message: "Salida registrada. Espacio liberado ✓", reserva_id: reserva.id });
        }
      );
    }
  );
};
 
// ── Espacios disponibles en tiempo real ───────────────────────────────────
exports.obtenerEspacios = (req, res) => {
  db.query(
    `SELECT e.tipo, e.capacidad_total,
            IFNULL(COUNT(r.id), 0) AS ocupados,
            (e.capacidad_total - IFNULL(COUNT(r.id), 0)) AS disponibles
     FROM espacios e
     LEFT JOIN reservas r ON r.tipo = e.tipo AND r.estado IN ('pendiente', 'ocupado')
     GROUP BY e.tipo, e.capacidad_total`,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener espacios" });
      res.json(result);
    }
  );
};
 
// ── Cancelar reservas expiradas (cron interno) ────────────────────────────
exports.cancelarExpiradas = (req, res) => {
  db.query(
    "UPDATE reservas SET estado = 'expirada' WHERE estado = 'pendiente' AND expira_en < NOW()",
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error" });
      res.json({ message: `${result.affectedRows} reservas expiradas canceladas` });
    }
  );
};
 
exports.obtenerPuestosOcupados = (req, res) => {
  db.query(
    "SELECT puesto FROM reservas WHERE estado IN ('pendiente', 'ocupado')",
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error" });
      res.json(result);
    }
  );
};
 
exports.cancelarReserva = (req, res) => {
  const usuario_id = req.userId;
  const { id } = req.params;
 
  db.query(
    "SELECT * FROM reservas WHERE id = ? AND usuario_id = ?",
    [id, usuario_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });
      if (!result.length) return res.status(404).json({ message: "Reserva no encontrada" });
 
      const reserva = result[0];
      if (!["pendiente", "activa"].includes(reserva.estado)) {
        return res.status(409).json({ message: "No se puede cancelar esta reserva" });
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