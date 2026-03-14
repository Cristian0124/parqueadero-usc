# Parqueadero USC - API REST

API REST para sistema de gestión de parqueadero de la Universidad Santiago de Cali.

##Tecnologías
- Node.js + Express
- MySQL / Railway MySQL
- JWT para autenticación
- bcrypt para contraseñas

## Despliegue en Railway

### 1. Crear proyecto en Railway
1. Ve a [railway.app](https://railway.app) e inicia sesión con GitHub
2. Clic en **"New Project"** → **"Deploy from GitHub repo"**
3. Selecciona este repositorio

### 2. Agregar base de datos MySQL
1. En el proyecto, clic **"New Service"** → **"Database"** → **"MySQL"**
2. Espera que se cree la BD

### 3. Importar la base de datos
1. Ve al servicio MySQL → pestaña **"Connect"**
2. Usa los datos de conexión con TablePlus o DBeaver
3. Ejecuta el archivo `database.sql`

### 4. Configurar variables de entorno
En el servicio Node.js → pestaña **"Variables"**, agrega:

| Variable | Valor |
|----------|-------|
| DB_HOST | (copiarlo de MySQL en Railway) |
| DB_PORT | (copiarlo de MySQL en Railway) |
| DB_USER | root |
| DB_PASSWORD | (copiarlo de MySQL en Railway) |
| DB_NAME | railway |
| DB_SSL | false |
| JWT_SECRET | un_secreto_largo_y_seguro |
| NODE_ENV | production |

### 5. Obtener URL pública
En el servicio → **"Settings"** → **"Networking"** → **"Generate Domain"**

---

## Endpoints de la API

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |

### Vehículos (requiere token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/vehiculos` | Registrar vehículo |
| GET | `/api/vehiculos` | Obtener mis vehículos |
| DELETE | `/api/vehiculos/:id` | Eliminar vehículo |

### Parqueos (requiere token)
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/parqueos/entrada` | Registrar entrada |
| PUT | `/api/parqueos/salida` | Registrar salida |
| GET | `/api/parqueos` | Ver todos los parqueos |

---

## Instalación local

```bash
git clone https://github.com/Cristian0124/parqueadero-usc.git
cd parqueadero-usc
npm install
cp .env.example .env
# Edita .env con tus datos locales
npm run dev
```

## 📄 Variables de entorno

Ver `.env.example` para referencia completa.
