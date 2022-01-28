import { AnyKeys, AnyObject, Document, FilterQuery, Types } from 'mongoose';
import NotificationModel, {
  INotificationModel,
} from '../models/NotificationModel';

export const createNotification = async (
  newNotification: AnyObject | AnyKeys<INotificationModel>
) => {
  return NotificationModel.create({
    ...newNotification,
  });
};

export const findNotificationById = async (notificationId: string) => {
  return NotificationModel.findById(notificationId);
};

export const findNotifications = async (
  filter?: FilterQuery<INotificationModel>
) => {
  return NotificationModel.find({ ...filter })
    .populate('sender', '_id username avatarURL')
    .populate('receiver', '_id username avatarURL')
    .populate({
      path: 'post',
      select: 'owner description',
      populate: { path: 'owner', select: 'username avatarURL' },
    });
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
