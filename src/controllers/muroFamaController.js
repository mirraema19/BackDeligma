import MuroFama from '../models/MuroFama.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener todos los miembros del muro de la fama
export const getAllMuroFama = async (req, res) => {
  try {
    const soloActivos = req.query.activos === 'true';
    const miembros = await MuroFama.getAll(soloActivos);

    res.json({
      success: true,
      data: miembros
    });
  } catch (error) {
    console.error('Error al obtener muro de la fama:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener muro de la fama',
      error: error.message
    });
  }
};

// Obtener miembro por ID
export const getMuroFamaById = async (req, res) => {
  try {
    const { id } = req.params;
    const miembro = await MuroFama.getById(id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }

    res.json({
      success: true,
      data: miembro
    });
  } catch (error) {
    console.error('Error al obtener miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener miembro',
      error: error.message
    });
  }
};

// Crear nuevo miembro
export const createMuroFama = async (req, res) => {
  try {
    const data = { ...req.body };

    console.log('📥 Datos recibidos en createMuroFama:');
    console.log('  - Body:', req.body);
    console.log('  - File:', req.file);

    // Procesar logros si vienen como string JSON
    if (typeof data.logros === 'string') {
      try {
        data.logros = JSON.parse(data.logros);
        console.log('  - Logros parseados:', data.logros);
      } catch (e) {
        console.error('❌ Error al parsear logros:', e);
        data.logros = [];
      }
    }

    // Convertir activo a booleano
    if (typeof data.activo === 'string') {
      data.activo = data.activo === 'true' || data.activo === '1';
    }

    // Convertir orden a número
    if (typeof data.orden === 'string') {
      data.orden = parseInt(data.orden) || 0;
    }

    // Agregar nombre de archivo de imagen subida
    if (req.file) {
      data.imagen = req.file.filename;
      console.log('  - Imagen subida:', data.imagen);
    }

    // Validación básica
    if (!data.nombre || data.nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre es obligatorio'
      });
    }

    console.log('✅ Datos a guardar:', data);

    const miembro = await MuroFama.create(data);

    console.log('✅ Miembro creado exitosamente:', miembro);

    res.status(201).json({
      success: true,
      message: 'Miembro agregado exitosamente',
      data: miembro
    });
  } catch (error) {
    console.error('❌ Error al crear miembro:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al crear miembro',
      error: error.message
    });
  }
};

// Actualizar miembro
export const updateMuroFama = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Procesar logros si vienen como string JSON
    if (typeof data.logros === 'string') {
      try {
        data.logros = JSON.parse(data.logros);
      } catch (e) {
        // Si no es un JSON válido, no actualizar logros
        delete data.logros;
      }
    }

    // Convertir activo a booleano
    if (typeof data.activo === 'string') {
      data.activo = data.activo === 'true' || data.activo === '1';
    }

    // Convertir orden a número
    if (typeof data.orden === 'string') {
      data.orden = parseInt(data.orden) || 0;
    }

    // Obtener miembro actual para eliminar imagen antigua si se sube una nueva
    const miembroActual = await MuroFama.getById(id);

    if (!miembroActual) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }

    // Agregar nombre de archivo de imagen subida y eliminar imagen antigua
    if (req.file) {
      data.imagen = req.file.filename;

      // Eliminar imagen antigua si existe
      if (miembroActual.imagen) {
        const oldImagePath = path.join(__dirname, '../../uploads/muro_fama', miembroActual.imagen);
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          console.log('No se pudo eliminar la imagen antigua:', err.message);
        }
      }
    }

    const miembro = await MuroFama.update(id, data);

    res.json({
      success: true,
      message: 'Miembro actualizado exitosamente',
      data: miembro
    });
  } catch (error) {
    console.error('Error al actualizar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar miembro',
      error: error.message
    });
  }
};

// Eliminar miembro
export const deleteMuroFama = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener miembro para eliminar imagen
    const miembro = await MuroFama.getById(id);

    if (!miembro) {
      return res.status(404).json({
        success: false,
        message: 'Miembro no encontrado'
      });
    }

    // Eliminar imagen asociada
    if (miembro.imagen) {
      const imagePath = path.join(__dirname, '../../uploads/muro_fama', miembro.imagen);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.log('No se pudo eliminar la imagen:', err.message);
      }
    }

    await MuroFama.delete(id);

    res.json({
      success: true,
      message: 'Miembro eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar miembro',
      error: error.message
    });
  }
};

// Activar/Desactivar miembro
export const toggleActivoMuroFama = async (req, res) => {
  try {
    const { id } = req.params;
    const miembro = await MuroFama.toggleActivo(id);

    res.json({
      success: true,
      message: `Miembro ${miembro.activo ? 'activado' : 'desactivado'} exitosamente`,
      data: miembro
    });
  } catch (error) {
    console.error('Error al cambiar estado de miembro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de miembro',
      error: error.message
    });
  }
};

// Reordenar miembros
export const reorderMuroFama = async (req, res) => {
  try {
    const { ordenamiento } = req.body;

    if (!Array.isArray(ordenamiento)) {
      return res.status(400).json({
        success: false,
        message: 'El ordenamiento debe ser un array'
      });
    }

    await MuroFama.reorder(ordenamiento);

    res.json({
      success: true,
      message: 'Orden actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al reordenar miembros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reordenar miembros',
      error: error.message
    });
  }
};
