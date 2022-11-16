// TODO: support behavior decorator for message delegation in an actor

import { BEHAVIOR, PATTERN, Behavior } from '../utils';

const handleBehavior =
  (behavior: Behavior) =>
  (pattern: symbol): MethodDecorator => {
    return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor) => {
      Reflect.defineMetadata(PATTERN, pattern, descriptor.value);
      Reflect.defineMetadata(BEHAVIOR, behavior, descriptor.value);
    };
  };

export const handleCall = handleBehavior(Behavior.Call);
export const handleCast = handleBehavior(Behavior.Cast);
