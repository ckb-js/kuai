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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registry.bind(ParentActor as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registry.bind(ChildActor as any)
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
      expect(registry.find(ActorReference.fromURI(`local://parent/child`), ActorBase)).toBeInstanceOf(ActorBase)
    })

    it(`should return undefined if not found`, () => {
      expect(registry.find(ActorReference.fromURI(`local://root`), ParentActor)).toBeUndefined()
    })
  })

  describe(`should have method Registry#isLive`, () => {
    it(`should return true if the specific actor is bound`, () => {
      expect(registry.isLive(`local://parent/child`)).toBeTruthy()
    })

    it(`should return true if the specific actor is not bound`, () => {
      expect(registry.isLive(`local://root`)).toBeFalsy()
    })
  })

  describe(`should have method bind`, () => {
    it(`should throw an exception if bind repeatedly`, () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        registry.bind(ParentActor as any)
      } catch (e) {
        expect(e).toBeInstanceOf(DuplicatedActorException)
      }
    })

    it(`should throw an exception if uri is empty`, () => {
      try {
        class InvalidActor extends ActorBase {}
        Reflect.defineMetadata(ProviderKey.Actor, { ref: { uri: '' } }, InvalidActor)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        registry.bind(InvalidActor as any)
      } catch (e) {
        expect(e).toBeInstanceOf(InvalidActorURIException)
      }
    })
  })
})
