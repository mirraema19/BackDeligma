import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const initDatabase = async () => {
  let connection;

  try {
    // Conectar sin especificar base de datos
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    console.log('📦 Conectado a MySQL. Inicializando base de datos...');

    // Crear base de datos si no existe
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'deligma_db'} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Base de datos '${process.env.DB_NAME || 'deligma_db'}' creada o ya existente`);

    // Usar la base de datos
    await connection.query(`USE ${process.env.DB_NAME || 'deligma_db'}`);

    // Crear tabla de usuarios (administradores)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        nombre_completo VARCHAR(100) NOT NULL,
        rol ENUM('admin', 'superadmin') DEFAULT 'admin',
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "usuarios" creada');

    // Crear tabla de revistas
    await connection.query(`
      CREATE TABLE IF NOT EXISTS revistas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(200) NOT NULL,
        descripcion TEXT,
        imagen_portada VARCHAR(255),
        archivo_pdf VARCHAR(255),
        fecha_publicacion DATE,
        numero_edicion VARCHAR(50),
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_fecha_publicacion (fecha_publicacion),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "revistas" creada');

    // Crear tabla del muro de la fama
    await connection.query(`
      CREATE TABLE IF NOT EXISTS muro_fama (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        imagen VARCHAR(255),
        descripcion TEXT,
        orden INT DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_orden (orden),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "muro_fama" creada');

    // Crear tabla de logros del muro de la fama
    await connection.query(`
      CREATE TABLE IF NOT EXISTS logros_fama (
        id INT AUTO_INCREMENT PRIMARY KEY,
        muro_fama_id INT NOT NULL,
        logro TEXT NOT NULL,
        orden INT DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (muro_fama_id) REFERENCES muro_fama(id) ON DELETE CASCADE,
        INDEX idx_muro_fama_id (muro_fama_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "logros_fama" creada');

    // Crear tabla de convocatorias
    await connection.query(`
      CREATE TABLE IF NOT EXISTS convocatorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
        ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_fecha_fin (fecha_fin),
        INDEX idx_activo (activo)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Tabla "convocatorias" creada');

    // Verificar si ya existe el usuario admin
    const [existingAdmin] = await connection.query(
      'SELECT id FROM usuarios WHERE username = ?',
      ['admin']
    );

    if (existingAdmin.length === 0) {
      // Crear usuario administrador por defecto
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await connection.query(
        `INSERT INTO usuarios (username, password, email, nombre_completo, rol)
         VALUES (?, ?, ?, ?, ?)`,
        ['admin', hashedPassword, 'admin@deligma.com', 'Administrador', 'superadmin']
      );
      console.log('✅ Usuario administrador creado');
      console.log('   👤 Usuario: admin');
      console.log('   🔑 Contraseña: admin123');
      console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    } else {
      console.log('ℹ️  Usuario administrador ya existe');
    }

    // Insertar datos de ejemplo del muro de la fama si no existen
    const [existingFama] = await connection.query('SELECT COUNT(*) as count FROM muro_fama');

    if (existingFama[0].count === 0) {
      // Insertar miembros
      await connection.query(`
        INSERT INTO muro_fama (nombre, imagen, descripcion, orden) VALUES
        ('Marisol Mijangos Cervantes', 'Persona1.jpg', 'Destacada participante en modelos de Naciones Unidas', 1),
        ('Edgar Baruc Ramírez Cruz', 'Persona2.jpg', 'Líder con múltiples reconocimientos internacionales', 2),
        ('Arafni Maori Zea Reyes', 'Persona3.jpg', 'Delegada con excelente desempeño en simulaciones', 3)
      `);

      // Obtener IDs de los miembros insertados
      const [members] = await connection.query('SELECT id, nombre FROM muro_fama ORDER BY id');

      // Insertar logros
      await connection.query(`
        INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES
        (${members[0].id}, 'Sinium BUAP - Mención honorífica', 1),
        (${members[1].id}, 'Meximun 2024 - Mención delegación', 1),
        (${members[1].id}, 'UMARMUN 2023 - Mejor delegación', 2),
        (${members[1].id}, 'UMARMUN 2024 - Mención honorífica', 3),
        (${members[1].id}, 'Sinium BUAP 2024 - Mejor delegación', 4),
        (${members[1].id}, 'DUMUN 2025 - Mención honorífica', 5),
        (${members[2].id}, 'Meximun 2024 - Mención honorífica', 1),
        (${members[2].id}, 'Umarmun 2024 - Mención honorífica', 2),
        (${members[2].id}, 'Sinium BUAP 2024 - Mejor delegación', 3),
        (${members[2].id}, 'DUMUN 2025 - Mención honorífica', 4)
      `);

      console.log('✅ Datos de ejemplo del muro de la fama insertados');
    }

    // Insertar convocatorias de ejemplo si no existen
    const [existingConvocatorias] = await connection.query('SELECT COUNT(*) as count FROM convocatorias');

    if (existingConvocatorias[0].count === 0) {
      await connection.query(`
        INSERT INTO convocatorias (titulo, emoji, descripcion, sede, fecha_inicio, fecha_fin) VALUES
        ('SINIUM 2026', '🎓', 'El SINIUM es el Modelo de Naciones Unidas de la BUAP que reúne a estudiantes de todo el país para debatir temas globales.', 'Puebla, México', '2026-03-01', '2026-03-15'),
        ('MINIMUN 2026', '🌐', 'MINIMUN es un Modelo de Naciones Unidas que promueve el diálogo y la cooperación entre jóvenes líderes.', 'Por confirmar', '2026-04-01', '2026-04-15'),
        ('DUMUN 2026', '🏛', 'Es un evento nacional en el que estudiantes simulan sesiones de la ONU para desarrollar habilidades diplomáticas.', 'Por confirmar', '2026-05-01', '2026-05-15')
      `);
      console.log('✅ Convocatorias de ejemplo insertadas');
    }

    // Insertar revistas de ejemplo si no existen
    const [existingRevistas] = await connection.query('SELECT COUNT(*) as count FROM revistas');

    if (existingRevistas[0].count === 0) {
      await connection.query(`
        INSERT INTO revistas (titulo, descripcion, imagen_portada, numero_edicion, fecha_publicacion) VALUES
        ('Revista Deligma - Edición Inaugural', 'Primera edición de nuestra revista con artículos sobre diplomacia y liderazgo estudiantil.', 'Carrusel1.jpg', 'Vol. 1 No. 1', '2025-01-15'),
        ('Revista Deligma - Segunda Edición', 'Edición especial dedicada a los modelos de Naciones Unidas y sus impactos.', 'Carrusel2.jpg', 'Vol. 1 No. 2', '2025-06-15')
      `);
      console.log('✅ Revistas de ejemplo insertadas');
    }

    console.log('\n🎉 Base de datos inicializada correctamente');
    console.log('📝 Resumen:');
    console.log('   - Base de datos: ' + (process.env.DB_NAME || 'deligma_db'));
    console.log('   - Tablas: usuarios, revistas, muro_fama, logros_fama, convocatorias');
    console.log('   - Usuario admin creado (si no existía)');
    console.log('   - Datos de ejemplo insertados\n');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

// Ejecutar la inicialización
initDatabase()
  .then(() => {
    console.log('✅ Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en el proceso:', error);
    process.exit(1);
  });
