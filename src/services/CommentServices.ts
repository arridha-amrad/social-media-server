import { AnyKeys, UpdateQuery } from 'mongoose';
import CommentModel, { ICommentModel } from '../models/CommentModel';

export const save = async (data: AnyKeys<ICommentModel>) => {
  const newComment = new CommentModel(data);
  return newComment.save();
};

export const findCommentById = async (commentId: string) => {
  return CommentModel.findById(commentId);
};

export const findByIdAndDelete = async (commentId: string) => {
  return CommentModel.findByIdAndDelete(commentId);
};

export const findCommentByIdAndUpdate = async (
  commentId: string,
  data: UpdateQuery<ICommentModel>
) => {
  return CommentModel.findByIdAndUpdate(commentId, data, { new: true });
};

export const updateLike = async (
  commentId: string,
  isLiked: boolean,
  likeSender: string
) => {
  return CommentModel.findByIdAndUpdate(
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
};
