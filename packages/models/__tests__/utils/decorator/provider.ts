import { describe, expect, it } from '@jest/globals'
import { ActorProvider, ActorProviderException, ProviderKey } from '../../../src'

// TODO: add tests of default ref metdata after uuid is used

describe(`Test providers`, () => {
  describe(`Test ActorProvider`, () => {
    it(`should throw an exception if target is undefined`, () => {
      try {
        ActorProvider({})(undefined)
      } catch (e) {
        expect(e).toBeInstanceOf(ActorProviderException)
      }
    })

    it(`should throw an exception if target is not a function`, () => {
      try {
        ActorProvider({})('1')
      } catch (e) {
        expect(e).toBeInstanceOf(ActorProviderException)
      }
    })

    it(`should add metadata of actor ref`, () => {
      const target = () => {
        // ignore
      }
      ActorProvider({ name: 'test_name' })(target)
      const metadata = Reflect.getMetadata(ProviderKey.Actor, target)
      expect(metadata.ref).toMatchObject({
        name: 'test_name',
        path: '/',
        protocol: 'local',
        uri: 'local://test_name',
      })
    })
  })
})
