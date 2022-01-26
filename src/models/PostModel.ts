import mongoose from 'mongoose';

interface IPostModel {
  id: string;
  imageURL: string;
  description: string;
  owner: mongoose.Types.ObjectId;
  comments: [mongoose.Types.ObjectId];
  likes: [mongoose.Types.ObjectId];
}

const PostSchema = new mongoose.Schema(
  {
    imageURL: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    comments: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'Comment',
      },
    ],
    likes: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const PostModel = mongoose.model<IPostModel>('Post', PostSchema);

export default PostModel;
