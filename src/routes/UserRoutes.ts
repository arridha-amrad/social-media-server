import { Router } from 'express';
import * as userController from '../controllers/UserController';
import { verifyAccessToken } from '../services/JwtServices';

// eslint-disable-next-line
const router = Router();

router.get('/me', verifyAccessToken, userController.me);

export default router;
