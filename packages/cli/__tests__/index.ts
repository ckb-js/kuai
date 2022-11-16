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

  describe('--config', () => {
    test('normal case 1', () => {
      const output1 = execSync('npx kuai node --config ./tests/kuai-config-case/kuai.config1.ts');
      expect(output1.toString()).toMatch(/ckb running on:\s+8114/);
    });

    test('normal case 2', () => {
      const output1 = execSync('npx kuai node --config ./tests/kuai-config-case/kuai.config2.ts');
      expect(output1.toString()).toMatch(/ckb running on:\s+8114/);
    });

    test('missing config file', () => {
      try {
        execSync('npx kuai --config');
      } catch (error) {
        console.log(error);
      }
    });

    test('can not find config file', () => {
      try {
        execSync('npx kuai --config kuai.config.ts');
      } catch (error) {
        console.log(error);
      }
    });
  });
});
