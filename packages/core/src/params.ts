import { ArgumentType } from './type';

const string: ArgumentType = {
  name: 'string',
  validate: (value) => typeof value === 'string',
};

const boolean: ArgumentType = {
  name: 'boolean',
  validate: (value) => typeof value === 'boolean',
};

const number: ArgumentType = {
  name: 'number',
  validate: (value) => typeof value === 'number',
};

const path: ArgumentType = {
  name: 'path',
  validate: (value) => typeof value === 'string',
};

export const paramTypes = {
  string,
  boolean,
  number,
  path,
};
