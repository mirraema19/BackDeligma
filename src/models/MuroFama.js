import pool from '../config/database.js';

class MuroFama {
  // Obtener todos los miembros del muro de la fama con sus logros
  static async getAll(soloActivos = false) {
    try {
      let query = `
        SELECT
          mf.id,
          mf.nombre,
          mf.imagen,
          mf.descripcion,
          mf.orden,
          mf.activo,
          mf.fecha_creacion,
          mf.ultima_actualizacion
        FROM muro_fama mf
      `;

      if (soloActivos) {
        query += ' WHERE mf.activo = true';
      }

      query += ' ORDER BY mf.orden ASC, mf.fecha_creacion ASC';

      const [miembros] = await pool.query(query);

      // Obtener logros para cada miembro
      for (let miembro of miembros) {
        const [logros] = await pool.query(
          'SELECT id, logro, orden FROM logros_fama WHERE muro_fama_id = ? ORDER BY orden ASC',
          [miembro.id]
        );
        miembro.logros = logros;
      }

      return miembros;
    } catch (error) {
      throw error;
    }
  }

  // Obtener miembro por ID con sus logros
  static async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM muro_fama WHERE id = ?', [id]);

      if (rows.length === 0) {
        return null;
      }

      const miembro = rows[0];

      // Obtener logros
      const [logros] = await pool.query(
        'SELECT id, logro, orden FROM logros_fama WHERE muro_fama_id = ? ORDER BY orden ASC',
        [id]
      );

      miembro.logros = logros;

      return miembro;
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo miembro
  static async create(data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { nombre, imagen = null, descripcion = '', orden = 0, activo = true, logros = [] } = data;

      // Validar que el nombre existe
      if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre es obligatorio');
      }

      // Insertar miembro
      const [result] = await connection.query(
        'INSERT INTO muro_fama (nombre, imagen, descripcion, orden, activo) VALUES (?, ?, ?, ?, ?)',
        [nombre.trim(), imagen, descripcion, orden, activo]
      );

      const miembroId = result.insertId;

      // Insertar logros si existen
      if (Array.isArray(logros) && logros.length > 0) {
        for (let i = 0; i < logros.length; i++) {
          const logroTexto = typeof logros[i] === 'string' ? logros[i] : logros[i]?.logro || '';
          if (logroTexto.trim()) {
            await connection.query(
              'INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES (?, ?, ?)',
              [miembroId, logroTexto.trim(), i + 1]
            );
          }
        }
      }

      await connection.commit();

      return this.getById(miembroId);
    } catch (error) {
      await connection.rollback();
      console.error('Error en MuroFama.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Actualizar miembro
  static async update(id, data) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { nombre, imagen, descripcion, orden, activo, logros } = data;

      // Construir query dinámicamente
      const updates = [];
      const values = [];

      if (nombre !== undefined) {
        updates.push('nombre = ?');
        values.push(nombre);
      }
      if (imagen !== undefined) {
        updates.push('imagen = ?');
        values.push(imagen);
      }
      if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(descripcion);
      }
      if (orden !== undefined) {
        updates.push('orden = ?');
        values.push(orden);
      }
      if (activo !== undefined) {
        updates.push('activo = ?');
        values.push(activo);
      }

      if (updates.length > 0) {
        values.push(id);
        const [result] = await connection.query(
          `UPDATE muro_fama SET ${updates.join(', ')} WHERE id = ?`,
          values
        );

        if (result.affectedRows === 0) {
          throw new Error('Miembro no encontrado');
        }
      }

      // Actualizar logros si se proporcionan
      if (logros !== undefined) {
        // Eliminar logros existentes
        await connection.query('DELETE FROM logros_fama WHERE muro_fama_id = ?', [id]);

        // Insertar nuevos logros
        if (logros.length > 0) {
          for (let i = 0; i < logros.length; i++) {
            await connection.query(
              'INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES (?, ?, ?)',
              [id, logros[i], i + 1]
            );
          }
        }
      }

      await connection.commit();

      return this.getById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Eliminar miembro (esto también eliminará sus logros por CASCADE)
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM muro_fama WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        throw new Error('Miembro no encontrado');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Activar/Desactivar miembro
  static async toggleActivo(id) {
    try {
      const miembro = await this.getById(id);

      if (!miembro) {
        throw new Error('Miembro no encontrado');
      }

      const nuevoEstado = !miembro.activo;

      await pool.query('UPDATE muro_fama SET activo = ? WHERE id = ?', [nuevoEstado, id]);

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Reordenar miembros
  static async reorder(ordenamiento) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // ordenamiento es un array de { id, orden }
      for (let item of ordenamiento) {
        await connection.query('UPDATE muro_fama SET orden = ? WHERE id = ?', [item.orden, item.id]);
      }

      await connection.commit();

      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export default MuroFama;
