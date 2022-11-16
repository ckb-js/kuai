import { ARGS_METADATA, ParamType } from '../utils';

export type ParamData = object | string | number;

export const assignParamMetadata = <TParamtype = ParamType, TArgs = Array<unknown>>(
  args: TArgs,
  paramtype: TParamtype,
  index: number,
  data?: ParamData,
): Record<string, unknown> => ({
  ...args,
  [`${paramtype}:${index}}`]: {
    index,
    data,
  },
});

export const createParamDecorator =
  (paramtype: ParamType) =>
  (data: ParamData): ParameterDecorator =>
  (target, key, index) => {
    const args = Reflect.getMetadata(ARGS_METADATA, target.constructor, key) || {};
    Reflect.defineMetadata(ARGS_METADATA, assignParamMetadata(args, paramtype, index, data), target.constructor, key);
  };
