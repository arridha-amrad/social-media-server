/* eslint-disable no-unused-vars */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: string;
    PORT: string;
    MONGO_URI: string;
    CLIENT_ORIGIN: string;
    COOKIE_NAME: string;
    COOKIE_ID: string;
    NODEMAILER_EMAIL_TRANSPORTER: string;
    NODEMAILER_PASSWORD_TRANSPORTER: string;
    APP_NAME: string;
    AUTHOR: string;
    GOOGLE_OAUTH_REDIRECT_URL: string;
    GOOGLE_OAUTH_CLIENT_ID: string;
    GOOGLE_OAUTH_CLIENT_SECRET: string;
    FACEBOOK_OAUTH_CLIENT_ID: string;
    FACEBOOK_OAUTH_CLIENT_SECRET: string;
  }
}
