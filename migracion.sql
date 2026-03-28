-- ══════════════════════════════════════════════════════════
--  MIGRACIÓN — Parqueadero USC
--  Ejecutar una sola vez en la base de datos de Railway
-- ══════════════════════════════════════════════════════════

-- ── Tabla de reservas ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id       INT NOT NULL,
  tipo             ENUM('Carro','Moto','Bicicleta','Patineta') NOT NULL,
  placa            VARCHAR(10) DEFAULT NULL,
  fecha_reserva    DATETIME NOT NULL,
  qr_token         VARCHAR(40) NOT NULL UNIQUE,
  qr_salida_token  VARCHAR(50) NOT NULL UNIQUE,
  expira_en        DATETIME NOT NULL,
  estado           ENUM('activa','completada','expirada','cancelada') DEFAULT 'activa',
  hora_salida      DATETIME DEFAULT NULL,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ── Tabla de espacios disponibles ──────────────────────────
CREATE TABLE IF NOT EXISTS espacios (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  tipo             ENUM('Carro','Moto','Bicicleta','Patineta') NOT NULL UNIQUE,
  capacidad_total  INT NOT NULL DEFAULT 10
);

-- ── Capacidades iniciales (ajusta según el parqueadero real) 
INSERT IGNORE INTO espacios (tipo, capacidad_total) VALUES
  ('Carro',      20),
  ('Moto',       30),
  ('Bicicleta',  25),
  ('Patineta',   15);

-- ── Índices para búsquedas rápidas por token ───────────────
CREATE INDEX IF NOT EXISTS idx_reservas_qr_token        ON reservas(qr_token);
CREATE INDEX IF NOT EXISTS idx_reservas_qr_salida_token ON reservas(qr_salida_token);
CREATE INDEX IF NOT EXISTS idx_reservas_usuario         ON reservas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_reservas_estado          ON reservas(estado);
