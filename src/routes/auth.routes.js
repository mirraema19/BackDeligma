import express from 'express';
import { login, getProfile, changePassword, verifyToken as verifyTokenController } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/login', login);

// Rutas protegidas
router.get('/profile', verifyToken, getProfile);
router.post('/change-password', verifyToken, changePassword);
router.get('/verify', verifyToken, verifyTokenController);

export default router;
