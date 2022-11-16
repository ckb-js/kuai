// TODO: support message decorator for message extraction in an actor

import { ParamType } from '../utils';
import { createParamDecorator } from './utils';

export const Message = createParamDecorator(ParamType.Message);
