import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import CommentModel from '../models/CommentModel';
import PostModel from '../models/PostModel';

export const createCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req.body;
  const postId = req.params.postId;
  try {
    const newCommentData = new CommentModel({
      owner: req.userId,
      body,
      post: postId,
    });
    const newComment = await newCommentData.save();
    const comment = await newComment.populate(
      'owner',
      '_id username avatarURL'
    );
    await PostModel.findByIdAndUpdate(postId, {
      $push: { comments: newComment.id },
    });
    return res.status(200).json({ comment });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const getCommentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const postId = req.params.postId;

  try {
    const comments = await CommentModel.find({ post: postId });
    return res.status(200).json({ comments });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const getCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await CommentModel.findById(req.params.id);
    return res.status(200).json({ comment });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const deleteCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const comment = await CommentModel.findById(req.params.id);
    if (comment?.owner.toString() === req.userId) {
      await CommentModel.findByIdAndDelete(req.params.id);
      return res.status(200).send('comment deleted');
    } else {
      res.status(400).json({ message: 'You are not the owner' });
    }
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const updateCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;
  try {
    const comment = await CommentModel.findById(commentId);
    if (comment?.owner.toString() === req.userId) {
      const updatedComment = await CommentModel.findByIdAndUpdate(
        req.params.id,
        {
          ...req.body,
        },
        { new: true }
      );
      return res.status(200).json({ comment: updatedComment });
    } else {
      return res.status(400).json({ message: 'You are not the owner' });
    }
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const likeDislikeHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const commentId = req.params.id;
  try {
    const comment = await CommentModel.findById(commentId);
    const isLiked = comment?.likes.find(
      (userId) => userId.toString() === req.userId
    );
    const updatedComment = await CommentModel.findByIdAndUpdate(
      commentId,
      isLiked
        ? {
            $pull: { likes: req.userId },
          }
        : {
            $push: { likes: req.userId },
          },
      { new: true }
    );
    return res.status(200).json({ comment: updatedComment });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
