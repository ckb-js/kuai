import { ArgumentType } from './type';

export const fakeType: ArgumentType = {
  validate: () => true,
};

export const string: ArgumentType = {
  validate: (value) => typeof value === 'string',
};

export const boolean: ArgumentType = {
  validate: (value) => typeof value === 'boolean',
};

export const number: ArgumentType = {
  validate: (value) => typeof value === 'number',
};
