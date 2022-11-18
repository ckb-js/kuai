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
      const output = execSync('npx kuai demo-task1 --config ./__tests__/__fixtures__/kuai-config-case/kuai.config1.ts');
      expect(output.toString()).toMatch(/demo-task1/);
    });

    test('normal case 2', () => {
      const output = execSync('npx kuai demo-task2 --config ./__tests__/__fixtures__/kuai-config-case/kuai.config2.ts');
      expect(output.toString()).toMatch(/demo-task2/);
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
