import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import * as UserServices from '../services/UserServices';
import * as NotificationServices from '../services/NotificationServices';
import mongoose from 'mongoose';

export const me = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;
  try {
    const userData = await UserServices.findUserById(
      userId,
      '_id username email avatarURL fullName'
    );
    const notifications = await NotificationServices.findNotifications({
      receiver: new mongoose.Types.ObjectId(userId),
    });
    if (userData) {
      return res.status(200).json({
        user: userData,
        notifications,
      });
    }
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
