const db = require("../config/db");

exports.registrarEntrada = (req, res) => {
  const { vehiculo_id } = req.body;

  if (!vehiculo_id) {
    return res.status(400).json({ message: "vehiculo_id es requerido" });
  }

  // ✅ Verifica que no haya una entrada activa para este vehículo
  db.query(
    "SELECT id FROM parqueos WHERE vehiculo_id = ? AND estado = 'dentro'",
    [vehiculo_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error interno" });

      if (result.length > 0) {
        return res.status(409).json({ message: "El vehículo ya se encuentra dentro del parqueadero" });
      }

      db.query(
        "INSERT INTO parqueos(vehiculo_id, hora_entrada, estado) VALUES(?, NOW(), 'dentro')",
        [vehiculo_id],
        (err, result) => {
          if (err) return res.status(500).json({ message: "Error al registrar entrada" });
          res.status(201).json({ message: "Entrada registrada", id: result.insertId });
        }
      );
    }
  );
};

exports.registrarSalida = (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "id del parqueo es requerido" });
  }

  db.query(
    "UPDATE parqueos SET hora_salida = NOW(), estado = 'fuera' WHERE id = ? AND estado = 'dentro'",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al registrar salida" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Parqueo no encontrado o vehículo ya salió" });
      }

      res.json({ message: "Salida registrada" });
    }
  );
};

exports.obtenerParqueos = (req, res) => {
  db.query(
    `SELECT p.id, p.hora_entrada, p.hora_salida, p.estado,
            v.placa, v.tipo
     FROM parqueos p
     JOIN vehiculos v ON p.vehiculo_id = v.id
     ORDER BY p.hora_entrada DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener parqueos" });
      res.json(result);
    }
  );
};
