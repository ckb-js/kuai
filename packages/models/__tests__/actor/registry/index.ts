import { jest, describe, expect, it, beforeEach } from '@jest/globals'

jest.mock('ioredis', () => {
  return class Redis {
    xread = jest.fn()
    xadd = jest.fn()
  }
})

import {
  Registry,
  ActorBase,
  ProviderKey,
  ActorReference,
  DuplicatedActorException,
  InvalidActorURIException,
} from '../../../src'

class ChildActor extends ActorBase {}
class ParentActor extends ActorBase {}

Reflect.defineMetadata(ProviderKey.Actor, { ref: new ActorReference('child', '/parent/') }, ChildActor)
Reflect.defineMetadata(ProviderKey.Actor, { ref: new ActorReference('parent') }, ParentActor)

describe(`Test Registry`, () => {
  let registry: Registry

  beforeEach(() => {
    registry = new Registry()
    registry.bind(ParentActor)
    registry.bind(ChildActor)
  })

  describe.skip(`should have method Registry#load`, () => {
    // TODO:
  })

  describe(`should have method Registry#list`, () => {
    it(`should list 2 uris`, () => {
      expect([...registry.list()]).toEqual(['local://parent', 'local://parent/child'])
    })
  })

  describe(`should have method Registry#find`, () => {
    it(`should return an actor instance if found`, () => {
      expect(registry.find(`local://parent/child`)).toBeInstanceOf(ActorBase)
    })

    it(`should return undefined if not found`, () => {
      expect(registry.find(`local://root`)).toBeUndefined()
    })
  })

  describe(`should have method Registry#isLive`, () => {
    it(`should return true if the specific actor is bound`, () => {
      expect(registry.isLive(`local://parent/child`)).toBeTruthy()
    })

    it(`should return true if the specific actor is not bound`, () => {
      expect(registry.find(`local://root`)).toBeFalsy()
    })
  })

  describe(`should have method bind`, () => {
    it(`should throw an exception if bind repeatedly`, () => {
      try {
        registry.bind(ParentActor)
      } catch (e) {
        expect(e).toBeInstanceOf(DuplicatedActorException)
      }
    })

    it(`should throw an exception if uri is empty`, () => {
      try {
        class InvalidActor extends ActorBase {}
        Reflect.defineMetadata(ProviderKey.Actor, { ref: { uri: '' } }, InvalidActor)
        registry.bind(InvalidActor)
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidActorURIException)
      }
    })
  })
})
