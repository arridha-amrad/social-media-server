import { AnyKeys, UpdateQuery } from 'mongoose';
import PostModel, { IPostModel } from '../models/PostModel';

export const save = async (data: AnyKeys<IPostModel>) => {
  const newPost = new PostModel(data);
  return newPost.save();
};

export const findPostByIdAndUpdate = async (
  postId: string,
  data: UpdateQuery<IPostModel>
) => {
  return PostModel.findByIdAndUpdate(postId, data, { new: true });
};

export const findPostByIdAndDelete = async (postId: string) => {
  return PostModel.findByIdAndDelete(postId);
};

export const getPosts = async () => {
  return PostModel.find()
    .populate('owner', '_id username avatarURL')
    .populate('likes', '_id username avatarURL')
    .populate({
      path: 'comments',
      options: { sort: { createdAt: 'desc' } },
      populate: [
        {
          path: 'owner',
          select: '_id username avatarURL',
        },
        {
          path: 'likes',
          select: '_id username avatarURL',
        },
      ],
    })
    .sort({ createdAt: 'desc' });
};

export const findPostById = (postId: string) => {
  return PostModel.findById(postId)
    .populate('owner', '_id username avatarURL')
    .populate('likes', '_id username avatarURL')
    .populate({
      path: 'comments',
      options: { sort: { createdAt: 'desc' } },
      populate: [
        { path: 'owner', select: '_id username avatarURL' },
        { path: 'likes', select: '_id username avatarURL' },
      ],
    });
};

export const findById = async (postId: string) => {
  return PostModel.findById(postId);
};

export const addComment = async (postId: string, commentId: string) => {
  return PostModel.findByIdAndUpdate(postId, {
    $push: { comments: commentId },
  });
};

export const addLike = async (
  postId: string,
  isLiked: boolean,
  likeSender: string
) => {
  return PostModel.findByIdAndUpdate(
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
};
