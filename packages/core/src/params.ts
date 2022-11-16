import { ArgumentType, TaskParam, TaskArguments } from './type';

export const fakeType: ArgumentType = {
  name: 'fake',
  validate: () => true,
};

export const string: ArgumentType = {
  name: 'string',
  validate: (value) => typeof value === 'string',
};

export const boolean: ArgumentType = {
  name: 'boolean',
  validate: (value) => typeof value === 'boolean',
};

export const number: ArgumentType = {
  name: 'number',
  validate: (value) => typeof value === 'number',
};

export const path: ArgumentType = {
  name: 'path',
  validate: (value) => typeof value === 'string',
};

export const KUAI_GLOBAL_PARAMS: Record<string, TaskParam<TaskArguments>> = {
  config: {
    name: 'config',
    defaultValue: undefined,
    description: 'A Kuai config file.',
    type: path,
    isFlag: false,
    isOptional: true,
  },
};
