import express from 'express';
import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import oAuthFacebook from '../controllers/OAuthFacebook';

// eslint-disable-next-line
const router = express.Router();

router.get('/login', passport.authenticate('facebook', { session: false }));

router.get(
  '/callback',
  passport.authenticate('facebook', {
    assignProperty: 'federatedUser',
    failureRedirect: `${process.env.CLIENT_ORIGIN!}/login`,
  }),
  async (req: Request, res: Response, __: NextFunction) =>
    await oAuthFacebook(req, res)
);

export default router;
