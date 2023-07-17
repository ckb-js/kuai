import { jest, describe, expect, beforeEach, test } from '@jest/globals'
import { readFileSync as fsReadFileSync } from 'node:fs'
import { generateTsInterface } from '../../src/builtin-tasks/moleculec'

const mockExecSync = jest.fn()
const mockCreateWriteStreamWrite = jest.fn()
const mockCreateWriteStreamClose = jest.fn()

jest.mock('node:child_process', () => ({
  execSync: () => mockExecSync(),
}))

jest.mock('node:fs', () => ({
  createWriteStream: () => ({
    write: mockCreateWriteStreamWrite,
    close: mockCreateWriteStreamClose,
  }),
}))

function resetMock() {
  mockExecSync.mockReset()
  mockCreateWriteStreamWrite.mockReset()
  mockCreateWriteStreamClose.mockReset()
}

const { readFileSync } = jest.requireActual<{ readFileSync: typeof fsReadFileSync }>('node:fs')

describe('test generateTsInterface', () => {
  beforeEach(() => {
    resetMock()
  })
  const fileNames = ['bytes', 'array', 'struct', 'vec', 'table', 'union', 'moleculec-with-import']
  test.each(fileNames)(`%s`, async (caseName: string) => {
    const schema = await import(`./fixtures/${caseName}.json`)
    mockExecSync.mockReturnValueOnce(JSON.stringify(schema))
    generateTsInterface('schema.mol', 'output.ts')
    const outputs = readFileSync(`${__dirname}/fixtures/${caseName}.ts`)
      .toString()
      .split('\r\n')
      .filter((v) => !!v)
    for (let index = 0; index < outputs.length - 2; index++) {
      expect(mockCreateWriteStreamWrite).toBeCalledWith(outputs[index])
      if (index % 2 === 0) {
        expect(mockCreateWriteStreamWrite).toBeCalledWith(`\r\n`)
      } else {
        expect(mockCreateWriteStreamWrite).toBeCalledWith(`\r\n\r\n`)
      }
    }
  })
})
