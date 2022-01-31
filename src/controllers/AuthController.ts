import { NextFunction, Request, Response } from 'express';
import { AuthenticationStrategy, RequiredAuthAction } from '../enums/UserEnum';
import { v4 } from 'uuid';
import argon2 from 'argon2';
import sendEmail from '../services/MailServices';
import {
  emailConfirmation,
  resetPasswordRequest,
} from '../templates/MailTemplates';
import * as JwtService from '../services/JwtServices';
import * as msg from '../templates/NotificationTemplates';
import {
  responseSuccess,
  responseWithCookie,
  responseWithCookieOnly,
} from '../ServerResponse';
import { HTTP_CODE } from '../enums/HTTP_CODE';
import * as Validator from '../validators/AuthValidator';
import { BadRequestException } from '../exceptions/BadRequestException';
import Exception from '../exceptions/Exception';
import ServerErrorException from '../exceptions/ServerErrorException';
import { decrypt, encrypt } from '../utils/Encrypt';
import { LoginRequest, RegisterRequest } from '../dto/AuthData';
import UserModel from '../models/UserModel';
import { cookieOptions, getUserIdFromCookie } from '../utils/CookieHelpers';
import {
  getRefreshTokenFromRedis,
  setRefreshTokenInRedis,
} from '../services/RedisServices';
import * as NotificationServices from '../services/NotificationServices';
import * as PostServices from '../services/PostServices';
import * as UserServices from '../services/UserServices';
import { verificationCodeGenerator } from '../utils/CodeGenerator';
import * as VerificationCodeServices from '../services/VerificationCodeServices';

export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, username, password }: RegisterRequest = req.body;
  const { errors, valid } = Validator.registerValidator({
    email,
    password,
    username,
  });
  if (!valid) next(new BadRequestException(errors));
  try {
    const existingUsername = await UserServices.findUser({ username });

    if (existingUsername) {
      return res.status(400).json({
        message: 'Another user has been registered with this username',
      });
    }

    const existingEmail = await UserServices.findUser({ email });

    if (existingEmail) {
      return res.status(400).json({
        message: 'Another user has been registered with this email',
      });
    }

    const hashedPassword = await argon2.hash(password);

    const newUser = await UserServices.save({
      email,
      username,
      password: hashedPassword,
      strategy: AuthenticationStrategy.default,
      requiredAuthAction: RequiredAuthAction.emailVerification,
    });
    const verificationCode = await verificationCodeGenerator();

    await VerificationCodeServices.save({
      code: verificationCode,
      owner: newUser.id,
    });

    await sendEmail(email, emailConfirmation(username, verificationCode));

    return res
      .status(201)
      .cookie(process.env.COOKIE_ID, newUser.id, cookieOptions())
      .json({ message: msg.registerSuccess(email) });
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const emailVerificationHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { verificationCode } = req.body;
  if (verificationCode.trim() === '') {
    return next(new Exception(HTTP_CODE.BAD_REQUEST, 'invalid code'));
  }
  try {
    const userId = getUserIdFromCookie(req);
    const code = await VerificationCodeServices.findCode({ owner: userId });
    if (userId && code && !code.isComplete && code.code === verificationCode) {
      code.isComplete = true;
      await code.save();
      const user = await UserServices.findUserByIdAndUpdate(userId, {
        jwtVersion: v4(),
        isActive: true,
        isLogin: true,
        isVerified: true,
        requiredAuthAction: RequiredAuthAction.none,
      });
      if (user) {
        const accessToken = await JwtService.signAccessToken(user);
        const refreshToken = await JwtService.signRefreshToken(user);

        const encryptedAccessToken = encrypt(accessToken ?? '');
        const encryptedRefreshToken = encrypt(refreshToken ?? '');

        await setRefreshTokenInRedis(userId, encryptedRefreshToken);

        const loginUser = await UserServices.findUserById(
          userId,
          '-password -jwtVersion -strategy -requiredAuthAction'
        );

        if (loginUser) {
          return responseWithCookie(res, encryptedAccessToken, loginUser);
        }
      }
    } else {
      return next(
        new Exception(
          HTTP_CODE.METHOD_NOT_ALLOWED,
          'Action is stopped by server'
        )
      );
    }
  } catch (err) {
    console.log('confirmEmail errors : ', err);
    return next(new ServerErrorException());
  }
};

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { identity, password }: LoginRequest = req.body;
  const { valid, errors } = Validator.loginValidator({
    identity,
    password,
  });
  if (!valid) {
    return next(new BadRequestException(errors));
  }
  try {
    const user = await UserServices.findUserByUsernameOrEmail(identity);

    if (!user) {
      return next(new Exception(HTTP_CODE.NOT_FOUND, 'user not found'));
    }
    if (!user.isVerified) {
      return next(new Exception(HTTP_CODE.FORBIDDEN, msg.emailNotVerified));
    }

    const isMatch = await argon2.verify(user.password, password);
    if (!isMatch) {
      return next(new Exception(HTTP_CODE.FORBIDDEN, msg.invalidPassword));
    }

    const accessToken = await JwtService.signAccessToken(user);
    const refreshToken = await JwtService.signRefreshToken(user);

    if (accessToken && refreshToken) {
      const encryptedAccessToken = encrypt(accessToken);
      const encryptedRefreshToken = encrypt(refreshToken);

      // store refreshToken to redis
      await setRefreshTokenInRedis(user.id, encryptedRefreshToken);

      const userData = {
        _id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        avatarURL: user.avatarURL,
      };

      const notifications = await NotificationServices.findNotifications({
        receiver: user.id,
      });

      const posts = await PostServices.getPosts();

      return res
        .status(200)
        .cookie(process.env.COOKIE_NAME, encryptedAccessToken, cookieOptions())
        .cookie(process.env.COOKIE_ID, user.id, cookieOptions())
        .json({ user: userData, notifications, posts });
    }
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const logoutHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // verify the token first
    const userId = getUserIdFromCookie(req);
    if (userId) {
      // delete user's cookie
      res.clearCookie(process.env.COOKIE_NAME);
      res.clearCookie(process.env.COOKIE_ID);
      res.send('logout successfully');
    }
  } catch (error) {
    console.log(error);
    return next(new ServerErrorException());
  }
};

export const refreshTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUserIdFromCookie(req);
    const encryptedRefreshToken = await getRefreshTokenFromRedis(userId);
    const bearerRefreshToken = decrypt(encryptedRefreshToken ?? '');
    const token = bearerRefreshToken.split(' ')[1];
    const payload = await JwtService.verifyRefreshToken(token);
    const user = await UserModel.findById(payload?.userId);
    if (user) {
      if (user.jwtVersion !== payload?.jwtVersion ?? '') {
        return next(
          new Exception(HTTP_CODE.METHOD_NOT_ALLOWED, 'expired jwt version')
        );
      }
      const newAccessToken = await JwtService.signAccessToken(user);
      const newRefreshToken = await JwtService.signRefreshToken(user);
      // update cookie
      if (newAccessToken && newRefreshToken) {
        const newEncryptedAccessToken = encrypt(newAccessToken);
        const newEncryptedRefreshToken = encrypt(newRefreshToken);
        await setRefreshTokenInRedis(userId, newEncryptedRefreshToken);
        return responseWithCookieOnly(res, newEncryptedAccessToken);
      }
    }
  } catch (err) {
    console.log(err);
    return next(new ServerErrorException());
  }
};

export const forgotPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  const { errors, valid } = Validator.forgotPasswordValidator(email);
  if (!valid) {
    return next(new BadRequestException(errors));
  }
  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return next(new Exception(HTTP_CODE.NOT_FOUND, msg.userNotFound));
    }
    if (!user.isVerified) {
      return next(new Exception(HTTP_CODE.FORBIDDEN, msg.emailNotVerified));
    }
    user.requiredAuthAction = RequiredAuthAction.resetPassword;
    await user.save();
    const token = await JwtService.createEmailLinkToken(email);
    if (token) {
      const encryptedToken = encrypt(token).replace(/\//g, '_');
      await sendEmail(
        email,
        resetPasswordRequest(user.username, encryptedToken)
      );
      return responseSuccess(res, HTTP_CODE.OK, msg.forgotPassword(email));
    }
  } catch (err) {
    console.log('forgotPassword : ', err);
    return next(new ServerErrorException());
  }
};

export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { password } = req.body;
  const { encryptedLinkToken } = req.params;
  const { errors, valid } = Validator.resetPasswordValidator(password);
  if (!valid) {
    return next(new BadRequestException(errors));
  }
  try {
    const token = decrypt(encryptedLinkToken.replace(/_/g, '/'));
    const payload = await JwtService.verifyTokenLink(token);
    const user = await UserModel.findOne({ email: payload.email });
    if (user) {
      if (user.requiredAuthAction !== RequiredAuthAction.resetPassword) {
        return next(new Exception(HTTP_CODE.BAD_REQUEST, 'Action not granted'));
      }
      // update user's jwtVersion, password, requiredAuthAction
      await UserModel.findByIdAndUpdate(user.id, {
        jwtVersion: v4(),
        requiredAuthAction: RequiredAuthAction.none,
        password: await argon2.hash(password),
      });
      // return
      return responseSuccess(res, HTTP_CODE.OK, msg.resetPassword);
    }
  } catch (err) {
    console.log('confirmEmail errors : ', err);
    return next(new ServerErrorException());
  }
};
