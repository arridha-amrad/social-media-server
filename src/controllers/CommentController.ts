import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import CommentModel from '../models/CommentModel';
import * as NotificationServices from '../services/NotificationServices';
import { NotificationType } from '../enums/NotificationTypes';
import * as CommentServices from '../services/CommentServices';
import * as PostServices from '../services/PostServices';

export const createCommentHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { body } = req.body;
  const postId = req.params.postId;
  const commentOwner = req.userId;
  try {
    const post = await PostServices.findPostById(postId);
    if (post) {
      const newComment = await CommentServices.save({
        owner: commentOwner,
        body,
        post: postId,
      });
      const comment = await newComment.populate(
        'owner',
        '_id username avatarURL'
      );

      await PostServices.addComment(postId, newComment.id);

      let notification = null;
      // Create notification if comment is not from the post owner
      if (commentOwner !== post!.owner._id.toString()) {
        notification = await NotificationServices.createNotification({
          comment: newComment,
          post,
          type: 'commentPost',
          receiver: post!.owner,
          sender: commentOwner,
        });
      }
      return res.status(200).json({ comment, notification });
    } else {
      return res.status(404).json({ message: 'Post not found' });
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
    const comment = await CommentServices.findCommentById(commentId);
    if (comment?.owner.toString() === req.userId) {
      await CommentServices.findByIdAndDelete(commentId);

      // Delete notification of certain comment
      await NotificationServices.deleteNotifications({
        post: comment.post,
        comment: comment._id,
        receiver: comment.owner,
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
    const comment = await CommentServices.findCommentById(commentId);
    if (comment?.owner.toString() === req.userId) {
      const updatedComment = await CommentServices.findCommentByIdAndUpdate(
        commentId,
        { ...req.body }
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
    const comment = await CommentServices.findCommentById(commentId);
    const isLiked = comment?.likes.find(
      (userId) => userId.toString() === likeSender
    );

    const updatedComment = await CommentServices.updateLike(
      commentId,
      !!isLiked,
      likeSender
    );

    let notification = null;
    if (isLiked) {
      // if the comment got dislike, remove the related notification
      await NotificationServices.deleteNotifications({
        comment,
        type: NotificationType.likeComment,
        sender: likeSender,
        receiver: comment?.owner,
        post: comment?.post,
      });
    } else {
      // if the likeSender is not the commentOwner, create notification
      if (likeSender !== comment?.owner.toString()) {
        notification = await NotificationServices.createNotification({
          comment,
          sender: likeSender,
          type: NotificationType.likeComment,
          receiver: comment?.owner,
          post: comment?.post,
        });
      }
    }
    return res.status(200).json({ comment: updatedComment, notification });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
