export const INTERNAL_STATUS = Symbol('internal_status');
export const ARGS_METADATA = Symbol('args_metadata');
export const BEHAVIOR = Symbol('behavior');
export const PATTERN = Symbol('pattern');

export enum PROTOCOL {
  LOCAL = 'local',
}

export enum Behavior {
  Call = 'call',
  Cast = 'cast',
}

export enum ParamType {
  Status = 'status',
  Message = 'message',
  Context = 'context',
}

export const Status = {
  ok: Symbol('ok'),
  error: Symbol('error'),
  continue: Symbol('continue'),
  timeout: Symbol('timeout'),
  stop: Symbol('stop'),
};
