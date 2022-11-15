import { ErrorDescriptor, ERRORS } from './errors-list';

const inspect = Symbol.for('nodejs.util.inspect.custom');

export class CustomError extends Error {
  private _stack: string;

  constructor(message: string, public readonly parent?: Error) {
    super(message);

    this.name = this.constructor.name;

    // Avoid including the constructor in the stack trace
    // eslint-disable-next-line
    if ((Error as any).captureStackTrace !== undefined) {
      // eslint-disable-next-line
      (Error as any).captureStackTrace(this, this.constructor);
    }

    this._stack = this.stack ?? '';

    Object.defineProperty(this, 'stack', {
      get: () => this[inspect](),
    });
  }

  public [inspect](): string {
    let str = this._stack;
    if (this.parent !== undefined) {
      // eslint-disable-next-line
      const parentAsAny = this.parent as any;
      const causeString =
        parentAsAny[inspect]?.() ?? parentAsAny.inspect?.() ?? parentAsAny.stack ?? parentAsAny.toString();
      const nestedCauseStr = causeString
        .split('\n')
        .map((line: string) => `    ${line}`)
        .join('\n')
        .trim();
      str += `
    
    Caused by: ${nestedCauseStr}`;
    }
    return str;
  }
}

export class KuaiError extends CustomError {
  // eslint-disable-next-line
  public static isKuaiError(other: any): other is KuaiError {
    return other !== undefined && other != null && other._isKuaiError === true;
  }

  public readonly errorDescriptor: ErrorDescriptor;
  public readonly code: string;

  private readonly _isKuaiError: boolean;

  // eslint-disable-next-line
  constructor(errorDescriptor: ErrorDescriptor, msgArgs: Record<string, any> = {}, parentError?: Error) {
    const formattedMsg = applyErrorMsgTemplate(errorDescriptor.message, msgArgs);

    super(`${errorDescriptor.code}: ` + formattedMsg, parentError);

    this.errorDescriptor = errorDescriptor;
    this.code = errorDescriptor.code;

    this._isKuaiError = true;
  }
}

// eslint-disable-next-line
export function applyErrorMsgTemplate(template: string, values: { [templateVar: string]: any }): string {
  return _applyErrorMsgTemplate(template, values);
}

// eslint-disable-next-line
function _applyErrorMsgTemplate(template: string, values: { [templateVar: string]: any }): string {
  for (const varName of Object.keys(values)) {
    if (varName.match(/^[a-zA-Z][a-zA-Z0-9]*$/) === null) {
      throw new KuaiError(ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME, {
        var: varName,
      });
    }

    const varTag = `%${varName}%`;

    if (!template.includes(varTag)) {
      throw new KuaiError(ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING, {
        var: varName,
      });
    }
  }

  if (template.includes('%%')) {
    return template
      .split('%%')
      .map((part) => _applyErrorMsgTemplate(part, values))
      .join('%');
  }

  for (const varName of Object.keys(values)) {
    let varValue: string;

    if (values[varName] === undefined) {
      varValue = 'undefined';
    } else if (values[varName] === null) {
      varValue = 'null';
    } else {
      varValue = values[varName].toString();
    }

    if (varValue === undefined) {
      varValue = 'undefined';
    }

    const varTag = `%${varName}%`;

    if (varValue.match(/%([a-zA-Z][a-zA-Z0-9]*)?%/) !== null) {
      throw new KuaiError(ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG, { var: varName });
    }

    template = template.split(varTag).join(varValue);
  }

  return template;
}
