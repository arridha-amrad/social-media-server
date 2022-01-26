import express from 'express';
import { googleOauthHandler } from '../controllers/OAuthGoogle';

// eslint-disable-next-line
const router = express.Router();

router.get('/oauth', googleOauthHandler);

export default router;
