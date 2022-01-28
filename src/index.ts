// must be placed on top
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express, {
  Request,
  Response,
  NextFunction,
  Express,
  Application,
} from 'express';
import cookieParser from 'cookie-parser';
import { ExceptionType } from './interfacesAndTypes/ExceptionTypes';

import { errorMiddleware } from './middleware/ErrorMiddleware';
import { connect } from './database/mongo';
import passport from 'passport';

import FacebookPassportRoute from './routes/FacebookPassportRoute';
import GoogleOauthRoute from './routes/GoogleOauthRoute';
import AuthRoutes from './routes/AuthRoutes';
import UserRoutes from './routes/UserRoutes';
import PostRoutes from './routes/PostRoutes';
import CommentRoutes from './routes/CommentRoutes';
import { createServer } from 'http';

import './utils/Passport';
import { initializeSocketIO } from './utils/SocketIO';

console.clear();

export const runServer = (): Application => {
  const app: Express = express();
  const httpServer = createServer(app);

  initializeSocketIO(httpServer);

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
  app.use([
    passport.initialize(),
    cookieParser(),
    express.json(),
    express.urlencoded({ extended: false }),
  ]);

  app.use('/api/auth', AuthRoutes);
  app.use('/api/user', UserRoutes);
  app.use('/api/post', PostRoutes);
  app.use('/api/comment', CommentRoutes);
  app.use('/api/facebook', FacebookPassportRoute);
  app.use('/api/google', GoogleOauthRoute);
  app.use(
    // eslint-disable-next-line
    (err: ExceptionType, req: Request, res: Response, _: NextFunction) => {
      return errorMiddleware(err, req, res);
    }
  );
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} 🚀`);
  });

  return app;
};

connect(process.env.MONGO_URI ?? '')
  .then(() => {
    runServer();
  })
  .catch(() => console.log('failure on starting server'));
