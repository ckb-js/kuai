/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/__fixtures__/',
    '/__utils__/',
    'lib/builtin-tasks/test.js',
    'src/builtin-tasks/test.ts',
    '/__tests__/builtin-tasks/fixtures/',
  ],
}
