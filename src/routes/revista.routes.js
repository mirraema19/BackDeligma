import express from 'express';
import {
  getAllRevistas,
  getRevistaById,
  createRevista,
  updateRevista,
  deleteRevista,
  toggleActivoRevista
} from '../controllers/revistaController.js';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import { uploadRevista, handleMulterError } from '../middleware/upload.js';

const router = express.Router();

// Rutas públicas
router.get('/', getAllRevistas);
router.get('/:id', getRevistaById);

// Rutas protegidas (requieren autenticación de admin)
router.post('/', verifyToken, isAdmin, uploadRevista, handleMulterError, createRevista);
router.put('/:id', verifyToken, isAdmin, uploadRevista, handleMulterError, updateRevista);
router.delete('/:id', verifyToken, isAdmin, deleteRevista);
router.patch('/:id/toggle-activo', verifyToken, isAdmin, toggleActivoRevista);

export default router;
