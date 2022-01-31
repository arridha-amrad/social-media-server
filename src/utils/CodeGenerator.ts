import { customAlphabet } from 'nanoid/async';

export const verificationCodeGenerator = customAlphabet(
  // cspell:disable
  '1234567890qazwsxedcrfvtgbyhnujkilop',
  6
);
