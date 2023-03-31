import { ArgumentType } from './type'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from './errors-list'

const string: ArgumentType = {
  name: 'string',
  validate: (value) => {
    if (typeof value !== 'string') {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE)
    }
  },
}

const boolean: ArgumentType = {
  name: 'boolean',
  validate: (value) => {
    if (typeof value !== 'boolean') {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE)
    }
  },
}

const number: ArgumentType = {
  name: 'number',
  validate: (value) => {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE)
    }
  },
}

const path: ArgumentType = {
  name: 'path',
  validate: (value) => {
    if (typeof value !== 'string') {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE)
    }
  },
}

export const paramTypes = {
  string,
  boolean,
  number,
  path,
}
