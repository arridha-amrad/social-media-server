import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import * as NotificationServices from '../services/NotificationServices';
import * as PostServices from '../services/PostServices';

export const createPostHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { imageURL, description } = req.body;
  const postOwner = req.userId;
  try {
    const newPost = await PostServices.save({
      imageURL,
      description,
      owner: postOwner,
    });
    await newPost.populate('owner', '_id username avatarURL');
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
  const postId = req.params.id;
  try {
    const post = await PostServices.findPostById(postId);
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
    const posts = await PostServices.getPosts();
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
  const postId = req.params.id;
  try {
    const updatedPost = await PostServices.findPostByIdAndUpdate(postId, {
      ...req.body,
    });
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
  const postId = req.params.id;
  try {
    await NotificationServices.deleteNotifications({ post: postId });
    await PostServices.findPostByIdAndDelete(postId);
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
    const post = await PostServices.findById(postId);
    const isLiked = post?.likes.find(
      (userId) => userId.toString() === likeSender
    );
    const updatedPost = await PostServices.addLike(
      postId,
      !!isLiked,
      likeSender
    );
    if (post) {
      if (isLiked) {
        // if the post got dislike remove the likePost's notification as well
        await NotificationServices.deleteNotifications({
          receiver: post.owner.toString(),
          sender: likeSender,
          type: 'likePost',
          postId: postId,
        });
      } else {
        // create likePost notification if likeSender is not the post owner
        if (likeSender !== post.owner.toString()) {
          await NotificationServices.createNotification({
            receiver: post.owner,
            sender: likeSender,
            type: 'likePost',
            post: post,
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
