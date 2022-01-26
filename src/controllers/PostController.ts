import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import PostModel from '../models/PostModel';
import * as NotificationServices from '../services/NotificationServices';
import mongoose from 'mongoose';

export const createPostHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { imageURL, description } = req.body;
  try {
    const newPostData = new PostModel({
      imageURL,
      description,
      owner: req.userId,
    });
    const newPost = await newPostData.save();
    await newPost.populate('owner', 'id username avatarURL');
    return res.status(201).json({ post: newPost });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const getPostHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const post = await PostModel.findById(req.params.id);
    return res.status(200).json({ post });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const getPostsHandler = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const posts = await PostModel.find()
      .populate('owner', 'id username avatarURL')
      .populate({
        path: 'comments',
        options: { sort: { createdAt: 'desc' } },
        populate: {
          path: 'owner',
          select: 'id username avatarURL',
        },
      })
      .sort({ createdAt: 'desc' });
    return res.status(200).json({ posts });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const updatePostHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const updatedPost = await PostModel.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    return res.status(201).json({ post: updatedPost });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const deletePostHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await PostModel.findByIdAndDelete(req.params.id);
    return res.status(200).send('post deleted');
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
  const postId = req.params.id;
  const likeSender = req.userId;
  try {
    const post = await PostModel.findById(postId);
    const isLiked = post?.likes.find(
      (userId) => userId.toString() === likeSender
    );
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      isLiked
        ? {
            $pull: { likes: likeSender },
          }
        : {
            $push: { likes: likeSender },
          },
      { new: true }
    );
    if (post) {
      if (isLiked) {
        // if the post got dislike remove the likePost's notification as well
        await NotificationServices.deleteNotification({
          receiver: post.owner.toString(),
          sender: likeSender,
          type: 'likePost',
          postId: postId,
        });
      } else {
        // create likePost notification if likeSender is not post owner
        if (likeSender !== post.owner.toString()) {
          await NotificationServices.createNotification({
            receiver: post.owner,
            sender: new mongoose.Types.ObjectId(likeSender),
            type: 'likePost',
            postId: postId,
          });
        }
      }
    }
    return res.status(200).json({ post: updatedPost });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
