import pool from '../config/database.js';

class Convocatoria {
  // Obtener todas las convocatorias
  static async getAll(soloActivas = false, ocultarVencidas = false) {
    try {
      let query = 'SELECT * FROM convocatorias WHERE 1=1';
      const params = [];

      if (soloActivas) {
        query += ' AND activo = true';
      }

      if (ocultarVencidas) {
        query += ' AND (fecha_fin IS NULL OR fecha_fin >= CURDATE() OR ocultar_vencida = false)';
      }

      query += ' ORDER BY fecha_inicio DESC, fecha_creacion DESC';

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener convocatorias públicas (activas y no vencidas)
  static async getPublicas() {
    return this.getAll(true, true);
  }

  // Obtener convocatoria por ID
  static async getById(id) {
    try {
      const [rows] = await pool.query('SELECT * FROM convocatorias WHERE id = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Crear nueva convocatoria
  static async create(data) {
    try {
      const {
        titulo,
        emoji,
        descripcion,
        sede,
        fecha_inicio,
        fecha_fin,
        enlace_inscripcion,
        activo = true,
        ocultar_vencida = true
      } = data;

      const [result] = await pool.query(
        `INSERT INTO convocatorias (titulo, emoji, descripcion, sede, fecha_inicio, fecha_fin, enlace_inscripcion, activo, ocultar_vencida)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [titulo, emoji, descripcion, sede, fecha_inicio, fecha_fin, enlace_inscripcion, activo, ocultar_vencida]
      );

      return this.getById(result.insertId);
    } catch (error) {
      throw error;
    }
  }

  // Actualizar convocatoria
  static async update(id, data) {
    try {
      const {
        titulo,
        emoji,
        descripcion,
        sede,
        fecha_inicio,
        fecha_fin,
        enlace_inscripcion,
        activo,
        ocultar_vencida
      } = data;

      // Construir query dinámicamente
      const updates = [];
      const values = [];

      if (titulo !== undefined) {
        updates.push('titulo = ?');
        values.push(titulo);
      }
      if (emoji !== undefined) {
        updates.push('emoji = ?');
        values.push(emoji);
      }
      if (descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(descripcion);
      }
      if (sede !== undefined) {
        updates.push('sede = ?');
        values.push(sede);
      }
      if (fecha_inicio !== undefined) {
        updates.push('fecha_inicio = ?');
        values.push(fecha_inicio);
      }
      if (fecha_fin !== undefined) {
        updates.push('fecha_fin = ?');
        values.push(fecha_fin);
      }
      if (enlace_inscripcion !== undefined) {
        updates.push('enlace_inscripcion = ?');
        values.push(enlace_inscripcion);
      }
      if (activo !== undefined) {
        updates.push('activo = ?');
        values.push(activo);
      }
      if (ocultar_vencida !== undefined) {
        updates.push('ocultar_vencida = ?');
        values.push(ocultar_vencida);
      }

      if (updates.length === 0) {
        throw new Error('No hay campos para actualizar');
      }

      values.push(id);

      const [result] = await pool.query(
        `UPDATE convocatorias SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      if (result.affectedRows === 0) {
        throw new Error('Convocatoria no encontrada');
      }

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Eliminar convocatoria
  static async delete(id) {
    try {
      const [result] = await pool.query('DELETE FROM convocatorias WHERE id = ?', [id]);

      if (result.affectedRows === 0) {
        throw new Error('Convocatoria no encontrada');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Activar/Desactivar convocatoria
  static async toggleActivo(id) {
    try {
      const convocatoria = await this.getById(id);

      if (!convocatoria) {
        throw new Error('Convocatoria no encontrada');
      }

      const nuevoEstado = !convocatoria.activo;

      await pool.query('UPDATE convocatorias SET activo = ? WHERE id = ?', [nuevoEstado, id]);

      return this.getById(id);
    } catch (error) {
      throw error;
    }
  }

  // Verificar si una convocatoria está vencida
  static estaVencida(convocatoria) {
    if (!convocatoria.fecha_fin) {
      return false;
    }

    const fechaFin = new Date(convocatoria.fecha_fin);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    return fechaFin < hoy;
  }
}

export default Convocatoria;
