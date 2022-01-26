import express from 'express';
import {
  createCommentHandler,
  deleteCommentHandler,
  getCommentHandler,
  getCommentsHandler,
  updateCommentHandler,
  likeDislikeHandler,
} from '../controllers/CommentController';
import { verifyAccessToken } from '../services/JwtService';

// eslint-disable-next-line
const router = express.Router();

router.get('/:postId', verifyAccessToken, getCommentsHandler);
router.get('/single/:id', verifyAccessToken, getCommentHandler);
router.post('/:postId', verifyAccessToken, createCommentHandler);
router.post('/like-dislike/:id', verifyAccessToken, likeDislikeHandler);
router.put('/:id', verifyAccessToken, updateCommentHandler);
router.delete('/:id', verifyAccessToken, deleteCommentHandler);

export default router;
