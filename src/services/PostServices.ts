import PostModel from '../models/PostModel';

export const getPosts = async () => {
  return PostModel.find()
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
};

export const findPostById = (postId: string) => {
  return PostModel.findById(postId)
    .populate('owner', '_id username avatarURL')
    .populate('likes', '_id username')
    .populate({
      path: 'comments',
      options: { sort: { createdAt: 'desc' } },
      populate: [
        { path: 'owner', select: '_id username avatarURL' },
        { path: 'likes', select: '_id username' },
      ],
    });
};
