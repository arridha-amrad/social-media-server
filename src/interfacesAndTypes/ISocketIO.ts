import { INotificationModel } from '../models/NotificationModel';

export interface ServerToClientEvents {
  greet: (msg: string) => void;
  likeAlert: (data: INotificationModel) => void;
  commentAlert: (notification: INotificationModel) => void;
  likeCommentAlert: (notification: Notification) => void;
}

export interface ClientToServerEvents {
  addUser: (username: string) => void;
  likePost: (data: INotificationModel, toUsername: string) => void;
  addComment: (notification: INotificationModel, toUsername: string) => void;
  likeComment: (notification: Notification, toUsername: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
