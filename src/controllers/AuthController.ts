import { NextFunction, Request, Response } from 'express';
import { AuthenticationStrategy, RequiredAuthAction } from '../enums/UserEnum';
import { v4 } from 'uuid';
import argon2 from 'argon2';
import sendEmail from '../services/MailService';
import {
  emailConfirmation,
  resetPasswordRequest,
} from '../templates/MailTemplates';
import * as JwtService from '../services/JwtService';
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
import { customAlphabet } from 'nanoid/async';
import VerificationCodeModel from '../models/VerificationCodeModel';
import UserModel from '../models/UserModel';
import {
  cookieOptions,
  getAuthTokenFromCookie,
  getUserIdFromCookie,
} from '../utils/CookieHelpers';
import {
  getRefreshTokenFromRedis,
  setRefreshTokenInRedis,
} from '../services/redisServices';
import * as NotificationServices from '../services/NotificationServices';
import * as PostServices from '../services/PostServices';

export const checkIsAuthenticated = async (req: Request, res: Response) => {
  const userId = getUserIdFromCookie(req);
  const accessToken = getAuthTokenFromCookie(req);
  if (userId && accessToken) {
    const user = await UserModel.findById(userId);
    if (user) {
      res.send('login');
    }
  } else {
    res.send('not login');
  }
};

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
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({
        message: 'Another user has been registered with this username',
      });
    }
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Another user has been registered with this email',
      });
    }
    const hashedPassword = await argon2.hash(password);
    const newUser = new UserModel({
      email,
      username,
      password: hashedPassword,
      strategy: AuthenticationStrategy.default,
      requiredAuthAction: RequiredAuthAction.emailVerification,
    });
    await newUser.save();
    const verificationCodeGenerator = customAlphabet(
      // cspell:disable
      '1234567890qazwsxedcrfvtgbyhnujkilop',
      6
    );
    const verificationCode = await verificationCodeGenerator();
    const newVerificationCode = new VerificationCodeModel({
      code: verificationCode,
      owner: newUser.id,
    });
    await newVerificationCode.save();
    await sendEmail(email, emailConfirmation(username, verificationCode));
    res.cookie(process.env.COOKIE_ID, newUser.id, cookieOptions());
    res.status(201).json({ message: msg.registerSuccess(email) });
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
    const code = await VerificationCodeModel.findOne({
      owner: userId,
    }).populate('owner', '-password');
    if (userId && code && !code.isComplete && code.code === verificationCode) {
      code.isComplete = true;
      await code.save();
      const user = await UserModel.findByIdAndUpdate(
        userId,
        {
          jwtVersion: v4(),
          isActive: true,
          isLogin: true,
          isVerified: true,
          requiredAuthAction: RequiredAuthAction.none,
        },
        { new: true }
      );
      if (user) {
        const accessToken = await JwtService.signAccessToken(user);
        const refreshToken = await JwtService.signRefreshToken(user);
        const encryptedAccessToken = encrypt(accessToken ?? '');
        const encryptedRefreshToken = encrypt(refreshToken ?? '');
        await setRefreshTokenInRedis(userId, encryptedRefreshToken);
        const loginUser = await UserModel.findById(userId).select(
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
    const user = await UserModel.findOne(
      identity.includes('@') ? { email: identity } : { username: identity }
    );
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
        receiver: user._id,
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
