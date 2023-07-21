import { describe, expect, it } from '@jest/globals'
import { ActorProvider, ActorProviderException, ProviderKey } from '../../../src'

// TODO: add tests of default ref metdata after uuid is used

describe(`Test providers`, () => {
  describe(`Test ActorProvider`, () => {
    it(`should throw an exception if target is undefined`, () => {
      try {
        const decorator = ActorProvider({ ref: {} }) as (target: unknown) => void
        decorator(undefined)
      } catch (e) {
        expect(e).toBeInstanceOf(ActorProviderException)
      }
    })

    it(`should throw an exception if target is not a function`, () => {
      try {
        const decorator = ActorProvider({ ref: {} }) as (target: unknown) => void
        decorator('1')
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
      expect(metadata.autoBind).toBeFalsy()
    })

    it(`should add metadata of actor ref with bind option`, () => {
      const target = () => {
        // ignore
      }
      ActorProvider({ ref: { name: 'test_name' }, autoBind: true })(target)
      const metadata = Reflect.getMetadata(ProviderKey.Actor, target)
      expect(metadata.ref).toMatchObject({
        name: 'test_name',
        path: '/',
        protocol: 'local',
        uri: 'local://test_name',
      })
      expect(metadata.autoBind).toBeTruthy()
    })
  })
})
