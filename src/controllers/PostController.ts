import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import PostModel from '../models/PostModel';

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
  try {
    const post = await PostModel.findById(postId);
    const isLiked = post?.likes.find(
      (userId) => userId.toString() === req.userId
    );
    const updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      isLiked
        ? {
            $pull: { likes: req.userId },
          }
        : {
            $push: { likes: req.userId },
          },
      { new: true }
    );
    return res.status(200).json({ post: updatedPost });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
