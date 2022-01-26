import Express from 'express';
import * as authController from '../controllers/AuthController';
import { verifyAccessToken } from '../services/JwtService';

// eslint-disable-next-line
const router = Express.Router();

router.post('/login', authController.loginHandler);
router.post('/register', authController.registerHandler);
router.post('/forgot-password', authController.forgotPasswordHandler);
router.post(
  '/reset-password/:encryptedLinkToken',
  authController.resetPasswordHandler
);
router.put('/verify-email', authController.emailVerificationHandler);
router.get('/refresh-token', authController.refreshTokenHandler);
router.get('/isAuthenticated', authController.checkIsAuthenticated);
router.post('/logout', verifyAccessToken, authController.logoutHandler);

export default router;
