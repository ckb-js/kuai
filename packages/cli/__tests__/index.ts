import { describe, expect, test } from '@jest/globals';
import { execSync } from 'node:child_process';

describe('kuai cli', () => {
  test('ckb listening port', () => {
    const output1 = execSync('yarn kuai node');
    expect(output1.toString()).toMatch(/ckb running on:\s+8114/);

    const output2 = execSync('yarn kuai node --port 9999');
    expect(output2.toString()).toMatch(/ckb running on:\s+9999/);
  });
});
