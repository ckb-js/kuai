import { describe, it, expect } from '@jest/globals'
import { addLeadingSlash, concatPaths, stripEndSlash } from '../src/helper'

describe('Test Helper', () => {
  it(`addLeadingSlash should be work`, async () => {
    expect(addLeadingSlash('some_path')).toMatch('/some_path')
    expect(addLeadingSlash('/some_path_with_slash')).toMatch('/some_path_with_slash')
  })

  it(`stripEndSlash should be work`, async () => {
    expect(stripEndSlash('some_path')).toMatch('some_path')
    expect(stripEndSlash('some_path_with_slash/')).toMatch('some_path_with_slash')
  })

  it(`concatPaths should be work`, async () => {
    expect(concatPaths('root', 'children')).toMatch('/root/children')
    expect(concatPaths('/root', 'children')).toMatch('/root/children')
    expect(concatPaths('/root/', 'children')).toMatch('/root/children')
    expect(concatPaths('/root/', '/children')).toMatch('/root/children')
    expect(concatPaths('/root/', '/children/')).toMatch('/root/children')
    expect(concatPaths('/root/root2/root3/', '/children/')).toMatch('/root/root2/root3/children')
  })
})
