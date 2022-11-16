import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { execSync } from 'node:child_process';

describe('kuai cli', () => {
  beforeAll(() => {
    execSync('npm link');
  });

  afterAll(() => {
    execSync('npm unlink -g @kuai/cli');
  });

  test('ckb listening port', () => {
    const output1 = execSync('npx kuai node');
    expect(output1.toString()).toMatch(/ckb running on:\s+8114/);

    const output2 = execSync('npx kuai node --port 9999');
    expect(output2.toString()).toMatch(/ckb running on:\s+9999/);
  });
});
