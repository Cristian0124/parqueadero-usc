# 🚗 Parqueadero USC

Sistema de gestión de parqueadero desarrollado con Node.js, Express y MySQL.

## 📋 Requisitos

- Node.js v18+
- MySQL 8+
- Git

## 🗄️ Configuración de Base de Datos

Ejecuta este script en MySQL:

```sql
CREATE DATABASE parqueadero_usc;

USE parqueadero_usc;

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  placa VARCHAR(10),
  tipo VARCHAR(50),
  usuario_id INT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE parqueos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id INT,
  hora_entrada DATETIME,
  hora_salida DATETIME,
  estado VARCHAR(20),
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id)
);
```

## ⚙️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/parqueadero-usc.git
cd parqueadero-usc/backend

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 4. Ejecutar el servidor
npm run dev
```

## 🌐 Endpoints

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |

### Vehículos (requiere token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/vehiculos` | Listar mis vehículos |
| POST | `/api/vehiculos` | Registrar vehículo |
| DELETE | `/api/vehiculos/:id` | Eliminar vehículo |

### Parqueo (requiere token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/parqueos/entrada` | Registrar entrada |
| POST | `/api/parqueos/salida` | Registrar salida |
| GET | `/api/parqueos` | Ver historial |

## 🔐 Autenticación

Las rutas protegidas requieren el header:
```
Authorization: Bearer <token>
```

## 🛠️ Scripts

```bash
npm run dev    # Desarrollo con nodemon
npm start      # Producción
```
