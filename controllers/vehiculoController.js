const db = require("../config/db");

exports.crearVehiculo = (req, res) => {
  const { placa, tipo } = req.body;
  const usuario_id = req.userId;

  if (!placa || !tipo) {
    return res.status(400).json({ message: "Placa y tipo son requeridos" });
  }

  db.query(
    "INSERT INTO vehiculos(placa, tipo, usuario_id) VALUES(?, ?, ?)",
    [placa, tipo, usuario_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al registrar vehículo" });
      res.status(201).json({ message: "Vehículo registrado", id: result.insertId });
    }
  );
};

// solo retorna vehículos del usuario autenticado
exports.obtenerVehiculos = (req, res) => {
  const usuario_id = req.userId;

  db.query(
    "SELECT * FROM vehiculos WHERE usuario_id = ?",
    [usuario_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al obtener vehículos" });
      res.json(result);
    }
  );
};

exports.eliminarVehiculo = (req, res) => {
  const { id } = req.params;
  const usuario_id = req.userId;

  // que el vehículo le pertenece al usuario
  db.query(
    "DELETE FROM vehiculos WHERE id = ? AND usuario_id = ?",
    [id, usuario_id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Error al eliminar vehículo" });

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Vehículo no encontrado o no autorizado" });
      }

      res.json({ message: "Vehículo eliminado" });
    }
  );
};
