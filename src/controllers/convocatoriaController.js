import Convocatoria from '../models/Convocatoria.js';

// Obtener todas las convocatorias
export const getAllConvocatorias = async (req, res) => {
  try {
    const soloActivas = req.query.activas === 'true';
    const ocultarVencidas = req.query.ocultar_vencidas === 'true';

    const convocatorias = await Convocatoria.getAll(soloActivas, ocultarVencidas);

    res.json({
      success: true,
      data: convocatorias
    });
  } catch (error) {
    console.error('Error al obtener convocatorias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener convocatorias',
      error: error.message
    });
  }
};

// Obtener convocatorias públicas
export const getConvocatoriasPublicas = async (req, res) => {
  try {
    const convocatorias = await Convocatoria.getPublicas();

    res.json({
      success: true,
      data: convocatorias
    });
  } catch (error) {
    console.error('Error al obtener convocatorias públicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener convocatorias públicas',
      error: error.message
    });
  }
};

// Obtener convocatoria por ID
export const getConvocatoriaById = async (req, res) => {
  try {
    const { id } = req.params;
    const convocatoria = await Convocatoria.getById(id);

    if (!convocatoria) {
      return res.status(404).json({
        success: false,
        message: 'Convocatoria no encontrada'
      });
    }

    res.json({
      success: true,
      data: convocatoria
    });
  } catch (error) {
    console.error('Error al obtener convocatoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener convocatoria',
      error: error.message
    });
  }
};

// Crear nueva convocatoria
export const createConvocatoria = async (req, res) => {
  try {
    const data = req.body;

    const convocatoria = await Convocatoria.create(data);

    res.status(201).json({
      success: true,
      message: 'Convocatoria creada exitosamente',
      data: convocatoria
    });
  } catch (error) {
    console.error('Error al crear convocatoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear convocatoria',
      error: error.message
    });
  }
};

// Actualizar convocatoria
export const updateConvocatoria = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const convocatoria = await Convocatoria.update(id, data);

    res.json({
      success: true,
      message: 'Convocatoria actualizada exitosamente',
      data: convocatoria
    });
  } catch (error) {
    console.error('Error al actualizar convocatoria:', error);

    if (error.message === 'Convocatoria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar convocatoria',
      error: error.message
    });
  }
};

// Eliminar convocatoria
export const deleteConvocatoria = async (req, res) => {
  try {
    const { id } = req.params;

    await Convocatoria.delete(id);

    res.json({
      success: true,
      message: 'Convocatoria eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar convocatoria:', error);

    if (error.message === 'Convocatoria no encontrada') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar convocatoria',
      error: error.message
    });
  }
};

// Activar/Desactivar convocatoria
export const toggleActivoConvocatoria = async (req, res) => {
  try {
    const { id } = req.params;
    const convocatoria = await Convocatoria.toggleActivo(id);

    res.json({
      success: true,
      message: `Convocatoria ${convocatoria.activo ? 'activada' : 'desactivada'} exitosamente`,
      data: convocatoria
    });
  } catch (error) {
    console.error('Error al cambiar estado de convocatoria:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de convocatoria',
      error: error.message
    });
  }
};
