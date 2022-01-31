import mongoose from 'mongoose';

export interface ICommentModel {
  id: string;
  body: string;
  owner: mongoose.Types.ObjectId;
  likes: [mongoose.Types.ObjectId];
  post: mongoose.Types.ObjectId;
}

const CommentSchema = new mongoose.Schema(
  {
    body: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    post: {
      type: mongoose.Types.ObjectId,
      ref: 'Post',
    },
    likes: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const CommentModel = mongoose.model<ICommentModel>('Comment', CommentSchema);

export default CommentModel;
