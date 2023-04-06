import { describe, it, expect, jest, afterEach, beforeEach } from '@jest/globals'
import { ActorBase, Behavior, PayloadMissingInMessageException, ProviderKey } from '../../src'

const mockXAdd = jest.fn()

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const mockXRead = jest.fn<() => any>()

jest.mock('ioredis', () => {
  return class Redis {
    xread = mockXRead
    xadd = mockXAdd
  }
})

const PARENT_REF = {
  name: `parent`,
  path: `/`,
  protocol: `local`,
  uri: `local://parent`,
}

const CHILD_REF = {
  name: `child`,
  path: `/parent/`,
  protocol: `local`,
  uri: `local://parent/child`,
}

const THIRD_REF = {
  name: `third`,
  path: `/`,
  protocol: `local`,
  uri: `local://third`,
}

class ParentActor extends ActorBase {}
class ChildActor extends ActorBase {}
class ThirdActor extends ActorBase {}

Reflect.defineMetadata(ProviderKey.Actor, { ref: PARENT_REF }, ParentActor)
Reflect.defineMetadata(ProviderKey.Actor, { ref: CHILD_REF }, ChildActor)

describe(`Test Actor`, () => {
  afterEach(() => {
    mockXAdd.mockClear()
    mockXRead.mockClear()
  })

  describe(`should have ref`, () => {
    it(`should be a parent path if parent is nil`, () => {
      const actor = new ParentActor()
      expect(actor.ref).toMatchObject(PARENT_REF)
    })

    it(`should be a child path if parent is non-nil`, () => {
      const actor = new ChildActor()
      expect(actor.ref).toMatchObject(CHILD_REF)
    })

    it(`should be a third path`, () => {
      const actor = new ThirdActor(THIRD_REF)
      expect(actor.ref).toMatchObject(THIRD_REF)
    })
  })

  describe(`test static call/cast method`, () => {
    describe(`should throw an exception when payload is missing`, () => {
      it('should throw an exception when payload is missing on calling the static call method', async () => {
        try {
          await ActorBase.call(CHILD_REF.uri, PARENT_REF, null)
        } catch (e) {
          expect(e).toBeInstanceOf(PayloadMissingInMessageException)
        }
      })

      it('should throw an exception when payload is missing on calling the static cast method', async () => {
        try {
          await ActorBase.cast(CHILD_REF.uri, PARENT_REF, null)
        } catch (e) {
          expect(e).toBeInstanceOf(PayloadMissingInMessageException)
        }
      })
    })

    describe(`should push a message to message queue`, () => {
      const payload = { pattern: `test` }

      it(`should push a message when static call is invoked`, () => {
        ActorBase.call(CHILD_REF.uri, PARENT_REF, payload)
        expect(mockXAdd).toBeCalledWith(
          CHILD_REF.uri,
          '*',
          'from',
          PARENT_REF.uri,
          'behavior',
          Behavior.Call.toString(),
          'payload',
          JSON.stringify(payload),
          'timeout',
          0,
        )
      })

      it(`should push a message when static cast is invoked`, () => {
        ActorBase.cast(CHILD_REF.uri, PARENT_REF, payload)
        expect(mockXAdd).toBeCalledWith(
          CHILD_REF.uri,
          '*',
          'from',
          PARENT_REF.uri,
          'behavior',
          Behavior.Cast.toString(),
          'payload',
          JSON.stringify(payload),
          'timeout',
          0,
        )
      })
    })
  })

  describe(`test instance method call/cast`, () => {
    describe(`should push a message to message queue`, () => {
      const payload = { pattern: `test` }

      it(`should push a message when instance method call is invoked`, () => {
        const actor = new ParentActor()
        actor.call(CHILD_REF.uri, payload)
        expect(mockXAdd).toBeCalledWith(
          CHILD_REF.uri,
          '*',
          'from',
          PARENT_REF.uri,
          'behavior',
          Behavior.Call.toString(),
          'payload',
          JSON.stringify(payload),
          'timeout',
          0,
        )
      })

      it(`should push a message when instance method cast is invoked`, () => {
        const actor = new ParentActor()
        actor.cast(CHILD_REF.uri, payload)
        expect(mockXAdd).toBeCalledWith(
          CHILD_REF.uri,
          '*',
          'from',
          PARENT_REF.uri,
          'behavior',
          Behavior.Cast.toString(),
          'payload',
          JSON.stringify(payload),
          'timeout',
          0,
        )
      })
    })
  })

  //TODO: add more tests on exceptions

  describe(`test handleMail method`, () => {
    let actor: ActorBase
    let handleCallSpy: jest.Spied<(_msg: unknown) => void>
    let handleCastSpy: jest.Spied<(_msg: unknown) => void>
    beforeEach(() => {
      // mock two new mails arrived
      mockXRead
        .mockResolvedValueOnce([
          [
            'local://parent/child',
            [
              [
                '1670860016748-0',
                ['from', 'local://parent', 'behavior', 'call', 'payload', '{"pattern":"one"}', 'timeout', '0'],
              ],
            ],
          ],
        ])
        .mockResolvedValueOnce([
          [
            'local://parent/child',
            [
              [
                '1670860016748-1',
                ['from', 'local://parent', 'behavior', 'cast', 'payload', '{"pattern":"two"}', 'timeout', '0'],
              ],
            ],
          ],
        ])

      actor = new ChildActor()
      handleCallSpy = jest.spyOn(actor, 'handleCall')
      handleCastSpy = jest.spyOn(actor, 'handleCast')
    })

    afterEach(() => {
      handleCallSpy.mockClear()
      handleCastSpy.mockClear()
    })

    it(`should be callon on actor instantiation`, () => {
      expect(mockXRead).toBeCalledWith('BLOCK', 0, 'STREAMS', actor.ref.uri, '$')
    })

    it(`should call it self at the end with a new last id`, () => {
      expect(mockXRead).toHaveBeenCalledTimes(3)
      expect(mockXRead.mock.calls).toEqual([
        ['BLOCK', 0, 'STREAMS', actor.ref.uri, '$'],
        ['BLOCK', 0, 'STREAMS', actor.ref.uri, '1670860016748-0'],
        ['BLOCK', 0, 'STREAMS', actor.ref.uri, '1670860016748-1'],
      ])
    })

    describe(`should handle messages from message queue`, () => {
      it('should call handle call message', () => {
        expect(handleCallSpy).toBeCalledWith({
          behavior: 'call',
          from: { name: 'parent', path: '/', protocol: 'local', uri: 'local://parent', params: {} },
          payload: { pattern: 'one' },
          timeout: 0,
        })
      })
      it('should call handle cast message', () => {
        expect(handleCastSpy).toBeCalledWith({
          behavior: 'cast',
          from: { name: 'parent', path: '/', protocol: 'local', uri: 'local://parent', params: {} },
          payload: { pattern: 'two' },
          timeout: 0,
        })
      })
    })
  })
})
