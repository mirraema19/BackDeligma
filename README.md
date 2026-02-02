# BackDeligma - API Backend

API REST para la plataforma Deligma construida con Node.js, Express y MySQL.

## 🚀 Características

- **Autenticación JWT**: Sistema seguro de login para administradores
- **CRUD Completo**: Gestión de revistas, muro de la fama y convocatorias
- **Subida de Archivos**: Soporte para imágenes y PDFs
- **Base de Datos**: MySQL con relaciones y transacciones
- **CORS Configurado**: Listo para conexión con frontend
- **Arquitectura MVC**: Código organizado y escalable

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Instalar dependencias:**
```bash
cd BackDeligma
npm install
```

2. **Configurar variables de entorno:**
```bash
# Copia el archivo .env.example a .env
cp .env.example .env

# Edita el archivo .env con tus credenciales de MySQL
```

3. **Inicializar la base de datos:**
```bash
npm run init-db
```

Este comando:
- Crea la base de datos `deligma_db`
- Crea todas las tablas necesarias
- Inserta un usuario administrador por defecto
- Inserta datos de ejemplo

**Credenciales del administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer login.

4. **Iniciar el servidor:**
```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:5000`

## 📚 Estructura del Proyecto

```
BackDeligma/
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de MySQL
│   │   └── initDatabase.js      # Script de inicialización
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── revistaController.js
│   │   ├── muroFamaController.js
│   │   └── convocatoriaController.js
│   ├── models/
│   │   ├── Usuario.js
│   │   ├── Revista.js
│   │   ├── MuroFama.js
│   │   └── Convocatoria.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── revista.routes.js
│   │   ├── muroFama.routes.js
│   │   └── convocatoria.routes.js
│   ├── middleware/
│   │   ├── auth.js              # Verificación JWT
│   │   └── upload.js            # Subida de archivos
│   └── server.js                # Punto de entrada
├── uploads/                     # Archivos subidos
│   ├── revistas/
│   └── muro_fama/
├── .env                         # Variables de entorno
├── .env.example                 # Ejemplo de variables
├── package.json
└── README.md
```

## 🔐 Endpoints de Autenticación

### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "token": "jwt_token_here",
    "usuario": {
      "id": 1,
      "username": "admin",
      "email": "admin@deligma.com",
      "nombre_completo": "Administrador",
      "rol": "superadmin"
    }
  }
}
```

### Verificar Token
```
GET /api/auth/verify
Authorization: Bearer {token}
```

### Cambiar Contraseña
```
POST /api/auth/change-password
Authorization: Bearer {token}
Content-Type: application/json

{
  "currentPassword": "admin123",
  "newPassword": "nueva_contraseña_segura"
}
```

## 📖 Endpoints de Revistas

### Obtener todas las revistas
```
GET /api/revistas
GET /api/revistas?activas=true  # Solo revistas activas
```

### Obtener revista por ID
```
GET /api/revistas/:id
```

### Crear revista (requiere autenticación)
```
POST /api/revistas
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- titulo: string (requerido)
- descripcion: text
- imagen_portada: file (imagen)
- archivo_pdf: file (PDF)
- fecha_publicacion: date
- numero_edicion: string
- activo: boolean
```

### Actualizar revista (requiere autenticación)
```
PUT /api/revistas/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Eliminar revista (requiere autenticación)
```
DELETE /api/revistas/:id
Authorization: Bearer {token}
```

### Activar/Desactivar revista (requiere autenticación)
```
PATCH /api/revistas/:id/toggle-activo
Authorization: Bearer {token}
```

## 🌟 Endpoints del Muro de la Fama

### Obtener todos los miembros
```
GET /api/muro-fama
GET /api/muro-fama?activos=true  # Solo miembros activos
```

### Obtener miembro por ID
```
GET /api/muro-fama/:id
```

### Crear miembro (requiere autenticación)
```
POST /api/muro-fama
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- nombre: string (requerido)
- imagen: file (imagen)
- descripcion: text
- orden: integer
- activo: boolean
- logros: JSON array de strings
```

### Actualizar miembro (requiere autenticación)
```
PUT /api/muro-fama/:id
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

### Eliminar miembro (requiere autenticación)
```
DELETE /api/muro-fama/:id
Authorization: Bearer {token}
```

### Reordenar miembros (requiere autenticación)
```
POST /api/muro-fama/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "ordenamiento": [
    { "id": 1, "orden": 1 },
    { "id": 2, "orden": 2 },
    { "id": 3, "orden": 3 }
  ]
}
```

## 📢 Endpoints de Convocatorias

### Obtener todas las convocatorias
```
GET /api/convocatorias
GET /api/convocatorias?activas=true&ocultar_vencidas=true
```

### Obtener convocatorias públicas
```
GET /api/convocatorias/publicas
```

### Obtener convocatoria por ID
```
GET /api/convocatorias/:id
```

### Crear convocatoria (requiere autenticación)
```
POST /api/convocatorias
Authorization: Bearer {token}
Content-Type: application/json

{
  "titulo": "SINIUM 2026",
  "emoji": "🎓",
  "descripcion": "Descripción del evento...",
  "sede": "Puebla, México",
  "fecha_inicio": "2026-03-01",
  "fecha_fin": "2026-03-15",
  "enlace_inscripcion": "https://...",
  "activo": true,
  "ocultar_vencida": true
}
```

### Actualizar convocatoria (requiere autenticación)
```
PUT /api/convocatorias/:id
Authorization: Bearer {token}
Content-Type: application/json
```

### Eliminar convocatoria (requiere autenticación)
```
DELETE /api/convocatorias/:id
Authorization: Bearer {token}
```

## 🗄️ Esquema de Base de Datos

### Tabla: usuarios
- id (PK)
- username (UNIQUE)
- password (hash)
- email (UNIQUE)
- nombre_completo
- rol (admin, superadmin)
- activo
- fecha_creacion
- ultima_actualizacion

### Tabla: revistas
- id (PK)
- titulo
- descripcion
- imagen_portada
- archivo_pdf
- fecha_publicacion
- numero_edicion
- activo
- fecha_creacion
- ultima_actualizacion

### Tabla: muro_fama
- id (PK)
- nombre
- imagen
- descripcion
- orden
- activo
- fecha_creacion
- ultima_actualizacion

### Tabla: logros_fama
- id (PK)
- muro_fama_id (FK)
- logro
- orden
- fecha_creacion

### Tabla: convocatorias
- id (PK)
- titulo
- emoji
- descripcion
- sede
- fecha_inicio
- fecha_fin
- enlace_inscripcion
- activo
- ocultar_vencida
- fecha_creacion
- ultima_actualizacion

## 🔧 Solución de Problemas

### Error de conexión a MySQL
```bash
# Verifica que MySQL esté corriendo
mysql --version

# Verifica las credenciales en .env
# Asegúrate de que el usuario tenga permisos
```

### Error al inicializar la base de datos
```bash
# Elimina la base de datos y vuelve a crearla
mysql -u root -p
DROP DATABASE deligma_db;
exit

# Vuelve a ejecutar el script de inicialización
npm run init-db
```

### Error al subir archivos
```bash
# Verifica que las carpetas de uploads existan
mkdir -p uploads/revistas
mkdir -p uploads/muro_fama

# Verifica los permisos de las carpetas
chmod -R 755 uploads/
```

## 🚀 Despliegue en Producción

1. **Configura las variables de entorno:**
   - Cambia `JWT_SECRET` por una clave segura
   - Actualiza `DB_PASSWORD` con la contraseña de producción
   - Cambia `FRONTEND_URL` al dominio de producción

2. **Inicia el servidor:**
```bash
NODE_ENV=production npm start
```

3. **Considera usar PM2 para gestión de procesos:**
```bash
npm install -g pm2
pm2 start src/server.js --name backdeligma
pm2 save
pm2 startup
```

## 📝 Licencia

MIT

## 👥 Autor

Deligma - Universidad del Mar
