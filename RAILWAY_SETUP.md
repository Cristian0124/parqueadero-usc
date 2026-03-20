# ☁️ Guía: Conectar con Railway (Base de datos en la nube)

## 1. Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app) y regístrate (puedes usar GitHub).

## 2. Crear proyecto y base de datos MySQL

1. En el dashboard, haz clic en **"New Project"**.
2. Selecciona **"Deploy MySQL"** (está en la sección de bases de datos).
3. Railway crea la base de datos automáticamente.

## 3. Obtener la cadena de conexión

1. Entra al servicio **MySQL** que se creó.
2. Ve a la pestaña **"Variables"**.
3. Copia el valor de **`DATABASE_URL`** — se ve así:
   ```
   mysql://root:password@monorail.proxy.rlwy.net:12345/railway
   ```

## 4. Configurar el proyecto localmente

1. Copia el archivo de ejemplo:
   ```bash
   cp .env.example .env
   ```
2. Abre `.env` y pega tu `DATABASE_URL`:
   ```
   DATABASE_URL=mysql://root:password@monorail.proxy.rlwy.net:12345/railway
   ```

## 5. Crear las tablas en Railway

Conéctate a tu base de datos Railway y ejecuta el archivo `database.sql`.

**Opción A — MySQL CLI:**
```bash
mysql -h monorail.proxy.rlwy.net -P 12345 -u root -p railway < database.sql
```
*(reemplaza host, puerto y usuario con los valores de tu DATABASE_URL)*

**Opción B — TablePlus / DBeaver / MySQL Workbench:**
1. Crea una nueva conexión usando los datos de las **Variables** de Railway.
2. Abre y ejecuta el archivo `database.sql`.

**Opción C — Railway CLI:**
```bash
npm install -g @railway/cli
railway login
railway link   # selecciona tu proyecto
railway run mysql < database.sql
```

## 6. Instalar dependencias y levantar el servidor

```bash
npm install
npm run dev
```

Deberías ver:
```
✅ Base de datos conectada (Railway ☁️)
✅ Servidor corriendo en puerto 3000
```

## 7. (Opcional) Deploy del backend en Railway también

1. En tu proyecto Railway, haz clic en **"New Service" > "GitHub Repo"**.
2. Conecta tu repositorio.
3. Railway detecta Node.js automáticamente.
4. Agrega la variable `JWT_SECRET` en la pestaña **Variables** del servicio.
5. Railway se encarga del resto. ✅

---

## Variables de entorno resumidas

| Variable | Dónde obtenerla |
|---|---|
| `DATABASE_URL` | Railway > tu MySQL > Variables |
| `JWT_SECRET` | Invéntala tú (mín. 32 caracteres) |
| `PORT` | Opcional, Railway lo asigna solo |
