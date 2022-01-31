import express from 'express';
import {
  createPostHandler,
  deletePostHandler,
  getPostHandler,
  getPostsHandler,
  updatePostHandler,
  likeDislikeHandler,
} from '../controllers/PostController';
import { verifyAccessToken } from '../services/JwtServices';
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const apiLimiterCreatePost = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 2, // Limit each IP to 10 requests per `window` (here, per 1 minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// eslint-disable-next-line
const router = express.Router();

router.get('/', apiLimiter, verifyAccessToken, getPostsHandler);
router.get('/:id', verifyAccessToken, getPostHandler);
router.post('/', apiLimiterCreatePost, verifyAccessToken, createPostHandler);
router.put('/:id', verifyAccessToken, updatePostHandler);
router.delete('/:id', verifyAccessToken, deletePostHandler);
router.post(
  '/like-dislike/:id',
  apiLimiter,
  verifyAccessToken,
  likeDislikeHandler
);

export default router;
