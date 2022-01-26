import { CookieOptions, Request } from 'express';

export const cookieOptions = (): CookieOptions => {
  const date = new Date();
  date.setTime(date.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    expires: new Date(date),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
};

export const getUserIdFromCookie = (req: Request) => {
  return req.cookies.cid as string;
};

export const getAuthTokenFromCookie = (req: Request) => {
  return req.cookies.authCookie as string;
};
