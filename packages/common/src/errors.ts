export interface ErrorDescriptor {
  code: string
  message: string
}

const INTERNAL = {
  TEMPLATE_INVALID_VARIABLE_NAME: {
    code: 'TEMPLATE_INVALID_VARIABLE_NAME',
    message: 'Variable names can only include ascii letters and numbers, and start with a letter, but got %var%',
  },
  TEMPLATE_VARIABLE_TAG_MISSING: {
    code: 'TEMPLATE_VARIABLE_TAG_MISSING',
    message: "Variable %var%'s tag not present in the template",
  },
  TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG: {
    code: 'TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG',
    message: "Template values can't include variable tags, but %var%'s value includes one",
  },
}

const inspect = Symbol.for('nodejs.util.inspect.custom')

export class KError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class CustomError extends KError {
  private _stack: string

  constructor(message: string, public readonly parent?: Error) {
    super(message)

    this.name = this.constructor.name

    // Avoid including the constructor in the stack trace
    if (Error.captureStackTrace !== undefined) {
      Error.captureStackTrace(this, this.constructor)
    }

    this._stack = this.stack ?? ''

    Object.defineProperty(this, 'stack', {
      get: () => this[inspect](),
    })
  }

  public [inspect](): string {
    let str = this._stack
    if (this.parent !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentAsAny = this.parent as any
      const causeString =
        parentAsAny[inspect]?.() ?? parentAsAny.inspect?.() ?? parentAsAny.stack ?? parentAsAny.toString()
      const nestedCauseStr = causeString
        .split('\n')
        .map((line: string) => `    ${line}`)
        .join('\n')
        .trim()
      str += `

    Caused by: ${nestedCauseStr}`
    }
    return str
  }
}

export class KuaiError extends CustomError {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
  public static isKuaiError(other: any): other is KuaiError {
    return other instanceof KuaiError
  }

  public readonly errorDescriptor: ErrorDescriptor
  public readonly code: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(errorDescriptor: ErrorDescriptor, msgArgs: Record<string, any> = {}, parentError?: Error) {
    const formattedMsg = applyErrorMsgTemplate(errorDescriptor.message, msgArgs)

    super(`${errorDescriptor.code}: ` + formattedMsg, parentError)

    this.errorDescriptor = errorDescriptor
    this.code = errorDescriptor.code
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyErrorMsgTemplate(template: string, values: { [templateVar: string]: any }): string {
  return _applyErrorMsgTemplate(template, values)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function _applyErrorMsgTemplate(template: string, values: { [templateVar: string]: any }): string {
  for (const varName of Object.keys(values)) {
    if (varName.match(/^[a-zA-Z][a-zA-Z0-9]*$/) === null) {
      throw new KuaiError(INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME, {
        var: varName,
      })
    }

    const varTag = `%${varName}%`

    if (!template.includes(varTag)) {
      throw new KuaiError(INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING, {
        var: varName,
      })
    }
  }

  if (template.includes('%%')) {
    return template
      .split('%%')
      .map((part) => _applyErrorMsgTemplate(part, values))
      .join('%')
  }

  for (const varName of Object.keys(values)) {
    const varValue: string = values[varName]?.toString() ?? `${values[varName]}`

    const varTag = `%${varName}%`

    if (varValue.match(/%([a-zA-Z][a-zA-Z0-9]*)?%/) !== null) {
      throw new KuaiError(INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG, { var: varName })
    }

    template = template.split(varTag).join(varValue)
  }

  return template
}
