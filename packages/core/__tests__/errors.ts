import { describe, it } from '@jest/globals';

import { applyErrorMsgTemplate } from '../src/errors';
import { ERRORS } from '../src/errors-list';
import { expect } from '@jest/globals';
import { KuaiError } from '../src/errors';
import { ErrorDescriptor } from '../src/errors-list';

describe('applyErrorMessageTemplate', () => {
  describe('Variable names', () => {
    it('Should reject invalid variable names', () => {
      expectKuaiError(() => applyErrorMsgTemplate('', { '1': 1 }), ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME);

      expectKuaiError(() => applyErrorMsgTemplate('', { 'asd%': 1 }), ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME);

      expectKuaiError(
        () => applyErrorMsgTemplate('', { 'asd asd': 1 }),
        ERRORS.INTERNAL.TEMPLATE_INVALID_VARIABLE_NAME,
      );
    });
  });

  describe('Values', () => {
    it("Should't contain variable tags", () => {
      expectKuaiError(
        () => applyErrorMsgTemplate('%tag%', { tag: '%value%' }),
        ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG,
      );

      expectKuaiError(
        () => applyErrorMsgTemplate('%tag%', { tag: '%q1%' }),
        ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG,
      );

      expectKuaiError(
        () => applyErrorMsgTemplate('%tag%', { tag: '%%' }),
        ERRORS.INTERNAL.TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG,
      );
    });
  });

  describe('Replacements', () => {
    describe('Missing variable tag', () => {
      it('Should fail if a viable tag is missing', () => {
        expectKuaiError(() => applyErrorMsgTemplate('', { asd: '123' }), ERRORS.INTERNAL.TEMPLATE_VARIABLE_TAG_MISSING);
      });
    });

    describe('Missing variable', () => {
      it('Should work, leaving the variable tag', () => {
        expect(applyErrorMsgTemplate('%asd% %fgh%', { asd: '123' })).toBe('123 %fgh%');
      });
    });

    describe('String values', () => {
      it('Should replace variable tags for the values', () => {
        expect(applyErrorMsgTemplate('asd %asd% 123 %asd%', { asd: 'r' })).toBe('asd r 123 r');
      });
    });

    describe('Non-string values', () => {
      it('Should replace undefined values for undefined', () => {
        expect(applyErrorMsgTemplate('asd %asd% 123 %asd%', { asd: undefined })).toBe('asd undefined 123 undefined');
      });

      it('Should replace null values for null', () => {
        expect(applyErrorMsgTemplate('asd %asd% 123 %asd%', { asd: null })).toBe('asd null 123 null');
      });
    });
  });
});

export function expectKuaiError(
  // eslint-disable-next-line
  f: () => any,
  errorDescriptor: ErrorDescriptor,
  errorMessage?: string | RegExp,
): void {
  try {
    f();
    // eslint-disable-next-line
  } catch (error: any) {
    expect(error).toBeInstanceOf(KuaiError);
    _assertKuaiError(error, errorDescriptor, errorMessage);
    return;
  }

  throw new Error(`KuaiError code ${errorDescriptor.code} expected, but no Error was thrown`);
}

export async function expectKuaiErrorAsync(
  // eslint-disable-next-line
  f: () => Promise<any>,
  errorDescriptor: ErrorDescriptor,
  errorMessage?: string | RegExp,
): Promise<void> {
  try {
    await f();
    // eslint-disable-next-line
  } catch (error: any) {
    expect(error).toBeInstanceOf(KuaiError);
    _assertKuaiError(error, errorDescriptor, errorMessage);
    return;
  }

  throw new Error(`KuaiError code ${errorDescriptor.code} expected, but no Error was thrown`);
}

function _assertKuaiError(error: KuaiError, errorDescriptor: ErrorDescriptor, errorMessage?: string | RegExp): void {
  expect(error.code).toBe(errorDescriptor.code);
  expect(error.message).not.toMatch(/%[a-zA-Z][a-zA-Z0-9]*%/);

  if (typeof errorMessage == 'string') {
    expect(error.message).toContain(errorMessage);
  } else if (errorMessage != undefined) {
    expect(error.message).toMatch(errorMessage);
  }
}
