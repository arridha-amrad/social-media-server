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
