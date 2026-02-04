import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { testConnection } from './config/database.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import revistaRoutes from './routes/revista.routes.js';
import muroFamaRoutes from './routes/muroFama.routes.js';
import convocatoriaRoutes from './routes/convocatoria.routes.js';

// Configuración de variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Deligma funcionando correctamente',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      revistas: '/api/revistas',
      muroFama: '/api/muro-fama',
      convocatorias: '/api/convocatorias'
    }
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/revistas', revistaRoutes);
app.use('/api/muro-fama', muroFamaRoutes);
app.use('/api/convocatorias', convocatoriaRoutes);

// Ruta para verificar el estado de la API
app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();

  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint no encontrado',
    path: req.path
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    console.log('🔄 Verificando conexión a la base de datos...');
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error('No se pudo conectar a la base de datos');
      console.error('Asegurate de que PostgreSQL este corriendo y las credenciales sean correctas');
      console.error('Ejecuta: npm run init-db para inicializar la base de datos');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 ===================================');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`🚀 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🚀 URL: http://localhost:${PORT}`);
      console.log(`🚀 API: http://localhost:${PORT}/api`);
      console.log('🚀 ===================================');
      console.log('');

      if (dbConnected) {
        console.log('📝 Endpoints disponibles:');
        console.log(`   - POST   http://localhost:${PORT}/api/auth/login`);
        console.log(`   - GET    http://localhost:${PORT}/api/revistas`);
        console.log(`   - GET    http://localhost:${PORT}/api/muro-fama`);
        console.log(`   - GET    http://localhost:${PORT}/api/convocatorias`);
        console.log('');
      }

      console.log('💡 Presiona Ctrl+C para detener el servidor\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar el servidor
startServer();

// Manejo de cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 Señal SIGTERM recibida. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Señal SIGINT recibida. Cerrando servidor...');
  process.exit(0);
});

export default app;
