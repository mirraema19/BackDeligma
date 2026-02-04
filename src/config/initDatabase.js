import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const initDatabase = async () => {
  let client;

  try {
    // Conectar a PostgreSQL
    const connectionConfig = process.env.DATABASE_URL
      ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
      : {
          host: process.env.DB_HOST || 'localhost',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'deligma_db',
          port: process.env.DB_PORT || 5432,
        };

    client = new Client(connectionConfig);
    await client.connect();
    console.log('Conectado a PostgreSQL. Inicializando base de datos...');

    // Crear tabla de usuarios (administradores)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        nombre_completo VARCHAR(100) NOT NULL,
        rol VARCHAR(20) DEFAULT 'admin' CHECK (rol IN ('admin', 'superadmin')),
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "usuarios" creada');

    // Crear tabla de revistas
    await client.query(`
      CREATE TABLE IF NOT EXISTS revistas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        imagen_portada VARCHAR(255),
        archivo_pdf VARCHAR(255),
        fecha_publicacion DATE,
        numero_edicion VARCHAR(50),
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "revistas" creada');

    // Crear tabla del muro de la fama
    await client.query(`
      CREATE TABLE IF NOT EXISTS muro_fama (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        imagen VARCHAR(255),
        descripcion TEXT,
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "muro_fama" creada');

    // Crear tabla de logros del muro de la fama
    await client.query(`
      CREATE TABLE IF NOT EXISTS logros_fama (
        id SERIAL PRIMARY KEY,
        muro_fama_id INT NOT NULL REFERENCES muro_fama(id) ON DELETE CASCADE,
        logro TEXT NOT NULL,
        orden INT DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "logros_fama" creada');

    // Crear tabla de convocatorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS convocatorias (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        emoji VARCHAR(10),
        descripcion TEXT,
        sede VARCHAR(200),
        fecha_inicio DATE,
        fecha_fin DATE,
        enlace_inscripcion VARCHAR(255),
        activo BOOLEAN DEFAULT true,
        ocultar_vencida BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "convocatorias" creada');

    // Crear indices
    await client.query('CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_revistas_fecha ON revistas(fecha_publicacion)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_revistas_activo ON revistas(activo)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_muro_fama_orden ON muro_fama(orden)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_muro_fama_activo ON muro_fama(activo)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_logros_muro_id ON logros_fama(muro_fama_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_convocatorias_fecha ON convocatorias(fecha_fin)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_convocatorias_activo ON convocatorias(activo)');
    console.log('Indices creados');

    // Verificar si ya existe el usuario admin
    const existingAdmin = await client.query(
      'SELECT id FROM usuarios WHERE username = $1',
      ['admin']
    );

    if (existingAdmin.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(
        `INSERT INTO usuarios (username, password, email, nombre_completo, rol)
         VALUES ($1, $2, $3, $4, $5)`,
        ['admin', hashedPassword, 'admin@deligma.com', 'Administrador', 'superadmin']
      );
      console.log('Usuario administrador creado');
      console.log('   Usuario: admin');
      console.log('   Contrasena: admin123');
      console.log('   IMPORTANTE: Cambia esta contrasena despues del primer login');
    } else {
      console.log('Usuario administrador ya existe');
    }

    // Insertar datos de ejemplo del muro de la fama si no existen
    const existingFama = await client.query('SELECT COUNT(*) as count FROM muro_fama');

    if (parseInt(existingFama.rows[0].count) === 0) {
      const member1 = await client.query(
        `INSERT INTO muro_fama (nombre, imagen, descripcion, orden)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Marisol Mijangos Cervantes', 'Persona1.jpg', 'Destacada participante en modelos de Naciones Unidas', 1]
      );
      const member2 = await client.query(
        `INSERT INTO muro_fama (nombre, imagen, descripcion, orden)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Edgar Baruc Ramirez Cruz', 'Persona2.jpg', 'Lider con multiples reconocimientos internacionales', 2]
      );
      const member3 = await client.query(
        `INSERT INTO muro_fama (nombre, imagen, descripcion, orden)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Arafni Maori Zea Reyes', 'Persona3.jpg', 'Delegada con excelente desempeno en simulaciones', 3]
      );

      const id1 = member1.rows[0].id;
      const id2 = member2.rows[0].id;
      const id3 = member3.rows[0].id;

      await client.query(
        `INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES
        ($1, 'Sinium BUAP - Mencion honorifica', 1),
        ($2, 'Meximun 2024 - Mencion delegacion', 1),
        ($2, 'UMARMUN 2023 - Mejor delegacion', 2),
        ($2, 'UMARMUN 2024 - Mencion honorifica', 3),
        ($2, 'Sinium BUAP 2024 - Mejor delegacion', 4),
        ($2, 'DUMUN 2025 - Mencion honorifica', 5),
        ($3, 'Meximun 2024 - Mencion honorifica', 1),
        ($3, 'Umarmun 2024 - Mencion honorifica', 2),
        ($3, 'Sinium BUAP 2024 - Mejor delegacion', 3),
        ($3, 'DUMUN 2025 - Mencion honorifica', 4)`,
        [id1, id2, id3]
      );

      console.log('Datos de ejemplo del muro de la fama insertados');
    }

    // Insertar convocatorias de ejemplo si no existen
    const existingConvocatorias = await client.query('SELECT COUNT(*) as count FROM convocatorias');

    if (parseInt(existingConvocatorias.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO convocatorias (titulo, emoji, descripcion, sede, fecha_inicio, fecha_fin) VALUES
        ('SINIUM 2026', '🎓', 'El SINIUM es el Modelo de Naciones Unidas de la BUAP que reune a estudiantes de todo el pais para debatir temas globales.', 'Puebla, Mexico', '2026-03-01', '2026-03-15'),
        ('MINIMUN 2026', '🌐', 'MINIMUN es un Modelo de Naciones Unidas que promueve el dialogo y la cooperacion entre jovenes lideres.', 'Por confirmar', '2026-04-01', '2026-04-15'),
        ('DUMUN 2026', '🏛', 'Es un evento nacional en el que estudiantes simulan sesiones de la ONU para desarrollar habilidades diplomaticas.', 'Por confirmar', '2026-05-01', '2026-05-15')
      `);
      console.log('Convocatorias de ejemplo insertadas');
    }

    // Insertar revistas de ejemplo si no existen
    const existingRevistas = await client.query('SELECT COUNT(*) as count FROM revistas');

    if (parseInt(existingRevistas.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO revistas (titulo, descripcion, imagen_portada, numero_edicion, fecha_publicacion) VALUES
        ('Revista Deligma - Edicion Inaugural', 'Primera edicion de nuestra revista con articulos sobre diplomacia y liderazgo estudiantil.', 'Carrusel1.jpg', 'Vol. 1 No. 1', '2025-01-15'),
        ('Revista Deligma - Segunda Edicion', 'Edicion especial dedicada a los modelos de Naciones Unidas y sus impactos.', 'Carrusel2.jpg', 'Vol. 1 No. 2', '2025-06-15')
      `);
      console.log('Revistas de ejemplo insertadas');
    }

    console.log('\nBase de datos inicializada correctamente');
    console.log('Resumen:');
    console.log('   - Base de datos: ' + (process.env.DB_NAME || 'deligma_db'));
    console.log('   - Tablas: usuarios, revistas, muro_fama, logros_fama, convocatorias');
    console.log('   - Usuario admin creado (si no existia)');
    console.log('   - Datos de ejemplo insertados\n');

  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
    }
  }
};

initDatabase()
  .then(() => {
    console.log('Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });
