import { AnyKeys, FilterQuery, UpdateQuery } from 'mongoose';
import { IUserModel } from '../interfacesAndTypes/IUserModel';
import UserModel from '../models/UserModel';

export const save = async (user: AnyKeys<IUserModel>): Promise<IUserModel> => {
  const newUser = new UserModel(user);
  return newUser.save();
};

export const findUser = async (
  filter: FilterQuery<IUserModel>,
  selects?: string
) => {
  return UserModel.findOne(filter).select(selects);
};

export const findUserByUsernameOrEmail = async (
  usernameOrEmail: string
): Promise<IUserModel | null> => {
  return UserModel.findOne(
    usernameOrEmail.includes('@')
      ? { email: usernameOrEmail }
      : { username: usernameOrEmail }
  );
};

export const findUserById = async (
  userId: string,
  selects?: string
): Promise<IUserModel | null> => {
  return UserModel.findById(userId).select(selects);
};

export const findUserByIdAndUpdate = async (
  id: string,
  update: UpdateQuery<IUserModel>
): Promise<IUserModel | null> => {
  return UserModel.findByIdAndUpdate(id, update, { new: true });
};
