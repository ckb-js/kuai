import { describe, it, expect } from '@jest/globals'
import { addLeadingSlash, concatPaths, createRoute, matchParams, matchPath, stripEndSlash } from '../src/helper'
import { Key, pathToRegexp } from 'path-to-regexp'

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

  describe('CreateRoute', () => {
    it('createRoute should be ok', () => {
      const path = '/a/b/c/:d/e'
      const method = 'GET'
      const route = createRoute({ path, method })
      const paramKeys: Key[] = []
      expect(route).toEqual({
        path,
        method,
        middleware: undefined,
        regexp: pathToRegexp(path, paramKeys),
        paramKeys,
      })
    })
  })

  describe('MathPath', () => {
    const path = '/a/b/c/:d/e'
    const method = 'GET'
    const route = createRoute({ path, method })

    it('path should be matched', () => {
      expect(matchPath('/a/b/c/3/e', route)).toBeTruthy()
    })

    it('path should not be matched', () => {
      expect(matchPath('/a/b/3/e', route)).toBeFalsy()
    })
  })

  describe('MathParams', () => {
    const path = '/a/b/c/:d/e'
    const method = 'GET'
    const route = createRoute({ path, method })

    it('parameters should be matched', () => {
      expect(matchParams({ path: '/a/b/c/3/e', route })).toEqual({ d: '3' })
    })

    it('parameters should be empty if path not is matched', () => {
      expect(matchParams({ path: '/a/b/3/e', route })).toEqual({})
    })
  })
})
