import { Schema, model } from 'mongoose';

export type NotificationType = 'likePost' | 'commentPost' | 'likeComment';

export interface INotificationModel {
  id: string;
  receiver: Schema.Types.ObjectId;
  sender: Schema.Types.ObjectId;
  type: NotificationType;
  isRead: boolean;
  isChecked: boolean;
  postId: string;
  commentId: string;
}

const NotificationSchema = new Schema(
  {
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      required: true,
      type: Schema.Types.ObjectId,
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
    commentId: {
      type: String,
    },
    postId: {
      type: String,
    },
  },
  { timestamps: true }
);

const NotificationModel = model<INotificationModel>(
  'Notification',
  NotificationSchema
);

export default NotificationModel;
