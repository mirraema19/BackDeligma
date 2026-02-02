import Revista from '../models/Revista.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener todas las revistas
export const getAllRevistas = async (req, res) => {
  try {
    const soloActivas = req.query.activas === 'true';
    const revistas = await Revista.getAll(soloActivas);

    res.json({
      success: true,
      data: revistas
    });
  } catch (error) {
    console.error('Error al obtener revistas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener revistas',
      error: error.message
    });
  }
};

// Obtener revista por ID
export const getRevistaById = async (req, res) => {
  try {
    const { id } = req.params;
    const revista = await Revista.getById(id);

    if (!revista) {
      return res.status(404).json({
        success: false,
        message: 'Revista no encontrada'
      });
    }

    res.json({
      success: true,
      data: revista
    });
  } catch (error) {
    console.error('Error al obtener revista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener revista',
      error: error.message
    });
  }
};

// Crear nueva revista
export const createRevista = async (req, res) => {
  try {
    const data = { ...req.body };

    // Convertir activo a booleano
    if (typeof data.activo === 'string') {
      data.activo = data.activo === 'true' || data.activo === '1';
    }

    // Agregar nombres de archivos subidos
    if (req.files) {
      if (req.files.imagen_portada) {
        data.imagen_portada = req.files.imagen_portada[0].filename;
      }
      if (req.files.archivo_pdf) {
        data.archivo_pdf = req.files.archivo_pdf[0].filename;
      }
    }

    const revista = await Revista.create(data);

    res.status(201).json({
      success: true,
      message: 'Revista creada exitosamente',
      data: revista
    });
  } catch (error) {
    console.error('Error al crear revista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear revista',
      error: error.message
    });
  }
};

// Actualizar revista
export const updateRevista = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    // Convertir activo a booleano
    if (typeof data.activo === 'string') {
      data.activo = data.activo === 'true' || data.activo === '1';
    }

    // Obtener revista actual para eliminar archivos antiguos si se suben nuevos
    const revistaActual = await Revista.getById(id);

    if (!revistaActual) {
      return res.status(404).json({
        success: false,
        message: 'Revista no encontrada'
      });
    }

    // Agregar nombres de archivos subidos y eliminar archivos antiguos
    if (req.files) {
      if (req.files.imagen_portada) {
        data.imagen_portada = req.files.imagen_portada[0].filename;

        // Eliminar imagen antigua si existe
        if (revistaActual.imagen_portada) {
          const oldImagePath = path.join(__dirname, '../../uploads/revistas', revistaActual.imagen_portada);
          try {
            await fs.unlink(oldImagePath);
          } catch (err) {
            console.log('No se pudo eliminar la imagen antigua:', err.message);
          }
        }
      }

      if (req.files.archivo_pdf) {
        data.archivo_pdf = req.files.archivo_pdf[0].filename;

        // Eliminar PDF antiguo si existe
        if (revistaActual.archivo_pdf) {
          const oldPdfPath = path.join(__dirname, '../../uploads/revistas', revistaActual.archivo_pdf);
          try {
            await fs.unlink(oldPdfPath);
          } catch (err) {
            console.log('No se pudo eliminar el PDF antiguo:', err.message);
          }
        }
      }
    }

    const revista = await Revista.update(id, data);

    res.json({
      success: true,
      message: 'Revista actualizada exitosamente',
      data: revista
    });
  } catch (error) {
    console.error('Error al actualizar revista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar revista',
      error: error.message
    });
  }
};

// Eliminar revista
export const deleteRevista = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener revista para eliminar archivos
    const revista = await Revista.getById(id);

    if (!revista) {
      return res.status(404).json({
        success: false,
        message: 'Revista no encontrada'
      });
    }

    // Eliminar archivos asociados
    if (revista.imagen_portada) {
      const imagePath = path.join(__dirname, '../../uploads/revistas', revista.imagen_portada);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.log('No se pudo eliminar la imagen:', err.message);
      }
    }

    if (revista.archivo_pdf) {
      const pdfPath = path.join(__dirname, '../../uploads/revistas', revista.archivo_pdf);
      try {
        await fs.unlink(pdfPath);
      } catch (err) {
        console.log('No se pudo eliminar el PDF:', err.message);
      }
    }

    await Revista.delete(id);

    res.json({
      success: true,
      message: 'Revista eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar revista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar revista',
      error: error.message
    });
  }
};

// Activar/Desactivar revista
export const toggleActivoRevista = async (req, res) => {
  try {
    const { id } = req.params;
    const revista = await Revista.toggleActivo(id);

    res.json({
      success: true,
      message: `Revista ${revista.activo ? 'activada' : 'desactivada'} exitosamente`,
      data: revista
    });
  } catch (error) {
    console.error('Error al cambiar estado de revista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de revista',
      error: error.message
    });
  }
};
