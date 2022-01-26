import { Response } from 'express';
import { LoginResponse } from './dto/AuthData';
import { HTTP_CODE } from './enums/HTTP_CODE';
import { cookieOptions } from './utils/CookieHelpers';

export const responseWithCookie = (
  res: Response,
  encryptedAccessToken: string,
  user: LoginResponse
): void => {
  res
    .status(200)
    .cookie(process.env.COOKIE_NAME, encryptedAccessToken, cookieOptions())
    .cookie(process.env.COOKIE_ID, user.id, cookieOptions())
    .json({
      user,
    });
};

export const responseWithCookieOnly = (
  res: Response,
  encryptedAccessToken: string
): void => {
  res
    .status(200)
    .cookie(process.env.COOKIE_NAME, encryptedAccessToken, cookieOptions())
    .send('cookie renew');
};

// export const responseFailure = <T>(res: Response, status: HTTP_CODE, errors: T): void => {
//   res.status(status).json({
//     errors: errors,
//     success: null,
//   });
// };

export const responseSuccess = <T>(
  res: Response,
  status: HTTP_CODE,
  data: T
): void => {
  res.status(status).send(data);
};

// export const serverError = (res: Response): void => {
//   res.status(500).json({
//     error: {
//       generic: 'Something went wrong',
//     },
//   });
// };
