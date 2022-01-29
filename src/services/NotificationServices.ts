import { AnyKeys, AnyObject, Document, FilterQuery, Types } from 'mongoose';
import NotificationModel, {
  INotificationModel,
} from '../models/NotificationModel';

export const createNotification = async (
  data: AnyObject | AnyKeys<INotificationModel>
) => {
  const newNotification = await NotificationModel.create(data);
  return findNotificationById(newNotification.id);
};

export const createCommentNotification = async (
  data: AnyKeys<INotificationModel>
) => {
  const newNotification = await NotificationModel.create(data);
  const notification = await findNotificationById(newNotification.id);
  return notification;
};

export const findNotificationById = async (notificationId: string) => {
  return NotificationModel.findById(notificationId)
    .populate('sender', '_id username avatarURL')
    .populate('receiver', '_id username avatarURL')
    .populate('comment')
    .populate('post');
};

export const findNotifications = async (
  filter?: FilterQuery<INotificationModel>
) => {
  return NotificationModel.find({ ...filter })
    .populate('sender', '_id username avatarURL')
    .populate('receiver', '_id username avatarURL')
    .populate({
      path: 'comment',
      select: 'body createdAt owner',
      populate: { path: 'owner', select: 'username avatarURL' },
    })
    .populate({
      path: 'post',
      select: 'owner description',
      populate: { path: 'owner', select: 'username avatarURL' },
    })
    .sort({ createdAt: 'desc' });
};

export const checkNotifications = async (
  notifications: (Document<any, any, INotificationModel> &
    INotificationModel & {
      _id: Types.ObjectId;
    })[]
) => {
  notifications.forEach(async (notification) => {
    notification.isChecked = true;
    await notification.save();
  });
};

export const readNotification = async (
  notification: Document<any, any, INotificationModel> & INotificationModel
) => {
  notification.isRead = true;
  await notification?.save();
};

export const deleteNotification = async (
  filter: FilterQuery<INotificationModel>
) => {
  return NotificationModel.findOneAndDelete({
    ...filter,
  });
};
