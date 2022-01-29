import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import CommentModel from '../models/CommentModel';
import PostModel from '../models/PostModel';
import * as NotificationServices from '../services/NotificationServices';
import mongoose from 'mongoose';
import { NotificationType } from '../enums/NotificationTypes';

export const createCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req.body;
  const postId = req.params.postId;
  const commentOwner = req.userId;
  try {
    const newCommentData = new CommentModel({
      owner: commentOwner,
      body,
      post: postId,
    });
    const newComment = await newCommentData.save();
    const post = await PostModel.findById(postId);
    if (post) {
      const comment = await newComment.populate(
        'owner',
        '_id username avatarURL'
      );
      await PostModel.findByIdAndUpdate(postId, {
        $push: { comments: newComment.id },
      });

      let notification = null;
      // Create notification if comment is not from the post owner
      if (commentOwner !== post!.owner.toString()) {
        notification = await NotificationServices.createCommentNotification({
          comment: newComment,
          post,
          type: 'commentPost',
          receiver: post!.owner,
          sender: new mongoose.Types.ObjectId(commentOwner),
        });
      }
      return res.status(200).json({ comment, notification });
    }
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
  const commentId = req.params.id;
  try {
    const comment = await CommentModel.findById(commentId);
    if (comment?.owner.toString() === req.userId) {
      await CommentModel.findByIdAndDelete(commentId);

      // Delete notification of certain comment
      await NotificationServices.deleteNotification({
        type: 'commentPost',
        commentId: commentId,
      });

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
  const likeSender = req.userId;
  try {
    const comment = await CommentModel.findById(commentId);
    const isLiked = comment?.likes.find(
      (userId) => userId.toString() === likeSender
    );
    const updatedComment = await CommentModel.findByIdAndUpdate(
      commentId,
      isLiked
        ? {
            $pull: { likes: likeSender },
          }
        : {
            $push: { likes: likeSender },
          },
      { new: true }
    );
    if (isLiked) {
      // if the comment got dislike, remove the related notification
      await NotificationServices.deleteNotification({
        sender: likeSender,
        commentId,
        type: NotificationType.likeComment,
      });
    } else {
      // if the likeSender is not the commentOwner, create notification
      if (likeSender !== comment?.owner.toString()) {
        await NotificationServices.createNotification({
          commentId,
          sender: likeSender,
          type: NotificationType.likeComment,
          receiver: comment?.owner,
        });
      }
    }
    return res.status(200).json({ comment: updatedComment });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
