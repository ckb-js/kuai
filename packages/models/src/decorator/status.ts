// TODO: support status decorator to delegate internal status of an actor

import { INTERNAL_STATUS, ParamType } from '../utils';
import { createParamDecorator } from './utils';

/**
 * decorator InternalStatus will capture properties of an instance for delegation
 */
export const InternalStatus: PropertyDecorator = (target, key) => {
  // TODO: validation
  const status = Object.getOwnPropertyDescriptor(target, INTERNAL_STATUS)?.value;

  Object.assign(target, {
    [INTERNAL_STATUS]: {
      ...status,
      [key]: undefined,
    },
  });
};

export const Status = createParamDecorator(ParamType.Status);
