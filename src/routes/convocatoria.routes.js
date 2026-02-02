import express from 'express';
import {
  getAllConvocatorias,
  getConvocatoriasPublicas,
  getConvocatoriaById,
  createConvocatoria,
  updateConvocatoria,
  deleteConvocatoria,
  toggleActivoConvocatoria
} from '../controllers/convocatoriaController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllConvocatorias);
router.get('/publicas', getConvocatoriasPublicas);
router.get('/:id', getConvocatoriaById);

// Rutas protegidas (requieren autenticación de admin)
router.post('/', verifyToken, isAdmin, createConvocatoria);
router.put('/:id', verifyToken, isAdmin, updateConvocatoria);
router.delete('/:id', verifyToken, isAdmin, deleteConvocatoria);
router.patch('/:id/toggle-activo', verifyToken, isAdmin, toggleActivoConvocatoria);

export default router;
