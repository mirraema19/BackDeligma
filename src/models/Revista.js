import pool from '../config/database.js';

class Revista {
  // Obtener todas las revistas (con filtro de activas)
  static async getAll(soloActivas = false) {
    try {
      let query = 'SELECT * FROM revistas';

      if (soloActivas) {
        query += ' WHERE activo = true';
      }

      query += ' ORDER BY fecha_publicacion DESC, fecha_creacion DESC';

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener revista por ID
  static async getById(id) {
    try {
      const result = await pool.query('SELECT * FROM revistas WHERE id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear nueva revista
  static async create(data) {
    try {
      const {
        titulo,
        descripcion,
        imagen_portada,
        archivo_pdf,
        fecha_publicacion,
        numero_edicion,
        activo = true
      } = data;

      const result = await pool.query(
        `INSERT INTO revistas (titulo, descripcion, imagen_portada, archivo_pdf, fecha_publicacion, numero_edicion, activo)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [titulo, descripcion, imagen_portada, archivo_pdf, fecha_publicacion, numero_edicion, activo]
      );

      return this.getById(result.rows[0].id);
    } catch (error) {
      throw error;
    }
  }

  // Actualizar revista
  static async update(id, data) {
    try {
      const {
        titulo,
        descripcion,
        imagen_portada,
        archivo_pdf,
        fecha_publicacion,
        numero_edicion,
        activo
      } = data;

      // Construir query dinámicamente para actualizar solo los campos proporcionados
      const updates = [];
      const values = [];
      let paramIndex = 1;

      if (titulo !== undefined) {
        updates.push(`titulo = $${paramIndex++}`);
        values.push(titulo);
      }
      if (descripcion !== undefined) {
        updates.push(`descripcion = $${paramIndex++}`);
        values.push(descripcion);
      }
      if (imagen_portada !== undefined) {
        updates.push(`imagen_portada = $${paramIndex++}`);
        values.push(imagen_portada);
      }
      if (archivo_pdf !== undefined) {
        updates.push(`archivo_pdf = $${paramIndex++}`);
        values.push(archivo_pdf);
      }
      if (fecha_publicacion !== undefined) {
        updates.push(`fecha_publicacion = $${paramIndex++}`);
        values.push(fecha_publicacion);
      }
      if (numero_edicion !== undefined) {
        updates.push(`numero_edicion = $${paramIndex++}`);
        values.push(numero_edicion);
      }
      if (activo !== undefined) {
        updates.push(`activo = $${paramIndex++}`);
        values.push(activo);
      }

      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);

      const result = await pool.query(
        `UPDATE revistas SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );

      if (result.rowCount === 0) {
        throw new Error('Revista no encontrada');
      }

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar revista
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM revistas WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        throw new Error('Revista no encontrada');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Activar/Desactivar revista
  static async toggleActivo(id) {
    try {
      const revista = await this.getById(id);

      if (!revista) {
        throw new Error('Revista no encontrada');
      }

      const nuevoEstado = !revista.activo;

      await pool.query('UPDATE revistas SET activo = $1 WHERE id = $2', [nuevoEstado, id]);

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }
}

export default Revista;
