import express from 'express';
import {
  getAllMuroFama,
  getMuroFamaById,
  createMuroFama,
  updateMuroFama,
  deleteMuroFama,
  toggleActivoMuroFama,
  reorderMuroFama
} from '../controllers/muroFamaController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { uploadMuroFama, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllMuroFama);
router.get('/:id', getMuroFamaById);

// Rutas protegidas (requieren autenticación de admin)
router.post('/', verifyToken, isAdmin, uploadMuroFama, handleMulterError, createMuroFama);
router.put('/:id', verifyToken, isAdmin, uploadMuroFama, handleMulterError, updateMuroFama);
router.delete('/:id', verifyToken, isAdmin, deleteMuroFama);
router.patch('/:id/toggle-activo', verifyToken, isAdmin, toggleActivoMuroFama);
router.post('/reorder', verifyToken, isAdmin, reorderMuroFama);

export default router;
