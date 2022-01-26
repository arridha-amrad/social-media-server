/* eslint-disable no-unused-vars */
declare namespace Express {
  interface Request {
    userId: string;
    federatedUser: any;
    cookies: {
      qid: string;
      auth_cookie: string;
    };
  }
}
