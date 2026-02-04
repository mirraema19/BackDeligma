import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión a PostgreSQL
const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'deligma_db',
      port: process.env.DB_PORT || 5432,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

// Crear pool de conexiones
const pool = new Pool(dbConfig);

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Conexion exitosa a la base de datos PostgreSQL');
    client.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
    return false;
  }
};

// Función para ejecutar queries (compatible con placeholders $1, $2, etc.)
export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

// Función para obtener un client del pool (para transacciones)
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
