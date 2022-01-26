import redisClient from '../database/redis';

const refreshTokenKeyName = (userId: string) => {
  return `${userId}_refToken`;
};

export const setRefreshTokenInRedis = (
  userId: string,
  encryptedRefreshToken: string
) => {
  const key = refreshTokenKeyName(userId);
  return redisClient.set(key, encryptedRefreshToken);
};

export const getRefreshTokenFromRedis = (userId: string) => {
  const key = refreshTokenKeyName(userId);
  return redisClient.get(key);
};
