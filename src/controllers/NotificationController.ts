import { NextFunction, Request, Response } from 'express';
import ServerErrorException from '../exceptions/ServerErrorException';
import * as NotificationServices from '../services/NotificationServices';

export const checkNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const receiverId = req.userId;
  try {
    await NotificationServices.checkNotifications(receiverId);
    return res.status(200).send('notification checked');
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};
