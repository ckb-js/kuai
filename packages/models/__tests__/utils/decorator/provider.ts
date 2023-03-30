import { describe, expect, it } from '@jest/globals'
import { ActorProvider, ActorProviderException, ProviderKey } from '../../../src'

// TODO: add tests of default ref metdata after uuid is used

describe(`Test providers`, () => {
  describe(`Test ActorProvider`, () => {
    it(`should throw an exception if target is undefined`, () => {
      try {
        ActorProvider({ ref: {} })(undefined)
      } catch (e) {
        expect(e).toBeInstanceOf(ActorProviderException)
      }
    })

    it(`should throw an exception if target is not a function`, () => {
      try {
        ActorProvider({ ref: {} })('1')
      } catch (e) {
        expect(e).toBeInstanceOf(ActorProviderException)
      }
    })

    it(`should add metadata of actor ref`, () => {
      const target = () => {
        // ignore
      }
      ActorProvider({ ref: { name: 'test_name' } })(target)
      const metadata = Reflect.getMetadata(ProviderKey.Actor, target)
      expect(metadata.ref).toMatchObject({
        name: 'test_name',
        path: '/',
        protocol: 'local',
        uri: 'local://test_name',
      })
      expect(metadata.bindWhenBootstrap).toBeFalsy()
    })

    it(`should add metadata of actor ref with bind option`, () => {
      const target = () => {
        // ignore
      }
      ActorProvider({ ref: { name: 'test_name' }, bindWhenBootstrap: true })(target)
      const metadata = Reflect.getMetadata(ProviderKey.Actor, target)
      expect(metadata.ref).toMatchObject({
        name: 'test_name',
        path: '/',
        protocol: 'local',
        uri: 'local://test_name',
      })
      expect(metadata.bindWhenBootstrap).toBeTruthy()
    })
  })
})
