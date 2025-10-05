import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin, requirePMOrAdmin } from '../middleware/roleMiddleware';

const router = Router();
const authController = new AuthController();
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/verify-reset-code', authController.verifyResetCode);
router.post('/reset-password', authController.resetPassword);
router.get('/profile', authenticate, authController.getProfile);
router.get('/users', authenticate, requirePMOrAdmin, authController.getUsers);
router.post('/users', authenticate, requireAdmin, authController.createUser);
export default router;
