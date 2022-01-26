import mongoose from 'mongoose';

interface ICommentModel {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const CommentModel = mongoose.model<ICommentModel>('Comment', CommentSchema);

export default CommentModel;
