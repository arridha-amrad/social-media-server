/* eslint-disable new-cap */
import express from 'express';
import { checkNotification } from '../controllers/NotificationController';
import { verifyAccessToken } from '../services/JwtServices';

const router = express.Router();

router.post('/set-check', verifyAccessToken, checkNotification);

export default router;
