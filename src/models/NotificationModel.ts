import { Schema, model, Types } from 'mongoose';
import { NotificationType } from '../enums/NotificationTypes';

export interface INotificationModel {
  id: string;
  receiver: Types.ObjectId;
  sender: Types.ObjectId;
  type: NotificationType;
  isRead: boolean;
  isChecked: boolean;
  post: Types.ObjectId;
  comment: Types.ObjectId;
}

const NotificationSchema = new Schema(
  {
    receiver: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      required: true,
      type: Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['likePost', 'commentPost', 'likeComment'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isChecked: {
      type: Boolean,
      default: false,
    },
    comment: {
      type: Types.ObjectId,
      ref: 'Comment',
    },
    post: {
      type: Types.ObjectId,
      ref: 'Post',
    },
  },
  { timestamps: true }
);

const NotificationModel = model<INotificationModel>(
  'Notification',
  NotificationSchema
);

export default NotificationModel;
