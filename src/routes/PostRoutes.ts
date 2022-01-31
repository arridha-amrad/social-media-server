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

// eslint-disable-next-line
const router = express.Router();

router.get('/', verifyAccessToken, getPostsHandler);
router.get('/:id', verifyAccessToken, getPostHandler);
router.post('/', verifyAccessToken, createPostHandler);
router.put('/:id', verifyAccessToken, updatePostHandler);
router.delete('/:id', verifyAccessToken, deletePostHandler);
router.post('/like-dislike/:id', verifyAccessToken, likeDislikeHandler);

export default router;
