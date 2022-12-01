import { describe, it, expect } from '@jest/globals'
import { ActorReference, InvalidPathException } from '../../src'

describe(`Test Actor Reference`, () => {
  describe(`should have specific attributes`, () => {
    const REF = {
      name: 'test_name',
      path: '/test_path/',
      protocol: 'http',
      uri: `http://test_path/test_name`,
    }
    const ref = new ActorReference(REF.name, REF.path, REF.protocol)

    it(`should have name`, () => {
      expect(ref.name).toBe(REF.name)
    })

    it(`should have path`, () => {
      expect(ref.path).toBe(REF.path)
    })

    it(`should have protocol`, () => {
      expect(ref.protocol).toBe(REF.protocol)
    })

    it(`should have uri`, () => {
      expect(ref.uri).toBe(REF.uri)
    })

    it(`should have json`, () => {
      expect(ref.json).toMatchObject(REF)
    })
  })

  describe(`should have default attributes`, () => {
    const ref = new ActorReference('test_name')

    it(`should have default path "/"`, () => {
      expect(ref.path).toBe('/')
    })

    it(`should have default protocol "local"`, () => {
      expect(ref.protocol).toBe('local')
    })
  })

  describe(`should be formatted in string`, () => {
    const ref = new ActorReference('test_name')

    it(`should be formatted in string`, () => {
      expect(`${ref}`).toBe(`local://test_name`)
    })
  })

  describe(`should throw exceptions if ref is invalid`, () => {
    describe(`should throw an exception if path is invalid`, () => {
      it(`should throw an exception if path does not start wtih /`, () => {
        try {
          new ActorReference('test_name', 'test_path/')
        } catch (e) {
          expect(e).toBeInstanceOf(InvalidPathException)
        }
      })

      it(`should throw an exception if path does not end wtih /`, () => {
        try {
          new ActorReference('test_name', '/test_path')
        } catch (e) {
          expect(e).toBeInstanceOf(InvalidPathException)
        }
      })
    })
  })
})
