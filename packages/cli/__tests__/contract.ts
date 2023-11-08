import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */

describe('kuai cli contract subcommand', () => {
  beforeAll(() => {
    execSync('npm link')
  })

  afterAll(() => {
    execSync('npm unlink -g @ckb-js/kuai-cli')
  })

  describe('contract command', () => {
    test('not init capsule case', () => {
      const output = execSync(
        'npx kuai contract new --name hello --config ./__tests__/__fixtures__/not-init-capsule-case/kuai.config.ts',
      )
      expect(output.toString()).toMatch(/Done/)

      // remove temp files
      rmSync('./__tests__/__fixtures__/not-init-capsule-case/contract', { recursive: true })
    })
  })
})
