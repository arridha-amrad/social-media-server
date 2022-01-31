import { AnyKeys, FilterQuery } from 'mongoose';
import VerificationCodeModel, {
  IVerificationCodeModel,
} from '../models/VerificationCodeModel';

export const save = async (data: AnyKeys<IVerificationCodeModel>) => {
  const newCode = new VerificationCodeModel(data);
  return newCode.save();
};

export const findCode = async (filter: FilterQuery<IVerificationCodeModel>) => {
  return VerificationCodeModel.findOne(filter);
};
