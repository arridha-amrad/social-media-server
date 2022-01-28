import { INotificationModel } from '../models/NotificationModel';

export interface ServerToClientEvents {
  greet: (msg: string) => void;
  likeAlert: (data: INotificationModel) => void;
}

export interface ClientToServerEvents {
  hello: () => void;
  addUser: (username: string) => void;
  likePost: (data: INotificationModel, toUsername: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  age: number;
}
