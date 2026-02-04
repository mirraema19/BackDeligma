import pool, { getClient } from '../config/database.js';

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

      const result = await pool.query(query);
      const miembros = result.rows;

      // Obtener logros para cada miembro
      for (let miembro of miembros) {
        const logrosResult = await pool.query(
          'SELECT id, logro, orden FROM logros_fama WHERE muro_fama_id = $1 ORDER BY orden ASC',
          [miembro.id]
        );
        miembro.logros = logrosResult.rows;
      }

      return miembros;
    } catch (error) {
      throw error;
    }
  }

  // Obtener miembro por ID con sus logros
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM muro_fama WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const miembro = result.rows[0];

      // Obtener logros
      const logrosResult = await pool.query(
        'SELECT id, logro, orden FROM logros_fama WHERE muro_fama_id = $1 ORDER BY orden ASC',
        [id]
      );

      miembro.logros = logrosResult.rows;

      return miembro;
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo miembro
  static async create(data) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { nombre, imagen = null, descripcion = '', orden = 0, activo = true, logros = [] } = data;

      // Validar que el nombre existe
      if (!nombre || nombre.trim() === '') {
        throw new Error('El nombre es obligatorio');
      }

      // Insertar miembro
      const result = await client.query(
        'INSERT INTO muro_fama (nombre, imagen, descripcion, orden, activo) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [nombre.trim(), imagen, descripcion, orden, activo]
      );

      const miembroId = result.rows[0].id;

      // Insertar logros si existen
      if (Array.isArray(logros) && logros.length > 0) {
        for (let i = 0; i < logros.length; i++) {
          const logroTexto = typeof logros[i] === 'string' ? logros[i] : logros[i]?.logro || '';
          if (logroTexto.trim()) {
            await client.query(
              'INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES ($1, $2, $3)',
              [miembroId, logroTexto.trim(), i + 1]
            );
          }
        }
      }

      await client.query('COMMIT');

      return this.getById(miembroId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error en MuroFama.create:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Actualizar miembro
  static async update(id, data) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const { nombre, imagen, descripcion, orden, activo, logros } = data;

      // Construir query dinámicamente
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (nombre !== undefined) {
        updates.push(`nombre = $${paramIndex++}`);
        values.push(nombre);
      }
      if (imagen !== undefined) {
        updates.push(`imagen = $${paramIndex++}`);
        values.push(imagen);
      }
      if (descripcion !== undefined) {
        updates.push(`descripcion = $${paramIndex++}`);
        values.push(descripcion);
      }
      if (orden !== undefined) {
        updates.push(`orden = $${paramIndex++}`);
        values.push(orden);
      }
      if (activo !== undefined) {
        updates.push(`activo = $${paramIndex++}`);
        values.push(activo);
      }

      if (updates.length > 0) {
        values.push(id);
        const result = await client.query(
          `UPDATE muro_fama SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
          values
        );

        if (result.rowCount === 0) {
          throw new Error('Miembro no encontrado');
        }
      }

      // Actualizar logros si se proporcionan
      if (logros !== undefined) {
        // Eliminar logros existentes
        await client.query('DELETE FROM logros_fama WHERE muro_fama_id = $1', [id]);

        // Insertar nuevos logros
        if (logros.length > 0) {
          for (let i = 0; i < logros.length; i++) {
            await client.query(
              'INSERT INTO logros_fama (muro_fama_id, logro, orden) VALUES ($1, $2, $3)',
              [id, logros[i], i + 1]
            );
          }
        }
      }

      await client.query('COMMIT');

      return this.getById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Eliminar miembro (esto también eliminará sus logros por CASCADE)
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM muro_fama WHERE id = $1', [id]);

      if (result.rowCount === 0) {
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

      await pool.query('UPDATE muro_fama SET activo = $1 WHERE id = $2', [nuevoEstado, id]);

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Reordenar miembros
  static async reorder(ordenamiento) {
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // ordenamiento es un array de { id, orden }
      for (let item of ordenamiento) {
        await client.query('UPDATE muro_fama SET orden = $1 WHERE id = $2', [item.orden, item.id]);
      }

      await client.query('COMMIT');

      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export default MuroFama;
