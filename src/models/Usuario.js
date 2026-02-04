import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

class Usuario {
  // Obtener todos los usuarios
  static async getAll() {
    try {
      const result = await pool.query(
        'SELECT id, username, email, nombre_completo, rol, activo, fecha_creacion FROM usuarios ORDER BY fecha_creacion DESC'
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario por ID
  static async getById(id) {
    try {
      const result = await pool.query(
        'SELECT id, username, email, nombre_completo, rol, activo, fecha_creacion FROM usuarios WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Obtener usuario por username
  static async getByUsername(username) {
    try {
      const result = await pool.query(
        'SELECT * FROM usuarios WHERE username = $1',
        [username]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Verificar credenciales de login
  static async verifyCredentials(username, password) {
    try {
      const usuario = await this.getByUsername(username);

      if (!usuario) {
        return null;
      }

      if (!usuario.activo) {
        throw new Error('Usuario inactivo');
      }

      const isPasswordValid = await bcrypt.compare(password, usuario.password);

      if (!isPasswordValid) {
        return null;
      }

      // Retornar usuario sin la contraseña
      const { password: _, ...usuarioSinPassword } = usuario;
      return usuarioSinPassword;
    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo usuario
  static async create(data) {
    try {
      const { username, password, email, nombre_completo, rol = 'admin' } = data;

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await pool.query(
        'INSERT INTO usuarios (username, password, email, nombre_completo, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [username, hashedPassword, email, nombre_completo, rol]
      );

      return this.getById(result.rows[0].id);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El usuario o email ya existe');
      }
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, data) {
    try {
      const { username, email, nombre_completo, rol, activo } = data;

      const result = await pool.query(
        'UPDATE usuarios SET username = $1, email = $2, nombre_completo = $3, rol = $4, activo = $5 WHERE id = $6',
        [username, email, nombre_completo, rol, activo, id]
      );

      if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
      }

      return this.getById(id);
    } catch (error) {
      if (error.code === '23505') {
        throw new Error('El usuario o email ya existe');
      }
      throw error;
    }
  }

  // Cambiar contraseña
  static async changePassword(id, currentPassword, newPassword) {
    try {
      // Verificar contraseña actual
      const result = await pool.query('SELECT password FROM usuarios WHERE id = $1', [id]);

      if (result.rows.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password);

      if (!isPasswordValid) {
        throw new Error('Contraseña actual incorrecta');
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [hashedPassword, id]);

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      const result = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

      if (result.rowCount === 0) {
        throw new Error('Usuario no encontrado');
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

export default Usuario;
