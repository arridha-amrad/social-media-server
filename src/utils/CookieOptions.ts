import { CookieOptions } from 'express';

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
