import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import { ActorBase, MessageQueue, Registry } from '../../src/actor';
import { Behavior } from '../../src/utils';

describe(`Test Actor`, () => {
  const registry = new Registry(ActorBase);
  const mqPush = jest.fn();
  class MQ extends MessageQueue {
    push = mqPush;
  }

  const PARENT_REF = {
    name: `parent`,
    path: `/`,
    protocol: `local`,
    uri: `local://parent`,
  };

  const CHILD_REF = {
    name: `child`,
    path: `/parent`,
    protocol: `local`,
    uri: `local://parent/child`,
  };

  beforeAll(() => {
    globalThis.mq = new MQ(registry);
  });

  afterAll(() => {
    delete globalThis.mq;
  });

  afterEach(() => {
    mqPush.mockClear();
  });

  describe(`should have ref`, () => {
    it(`should be a parent path if parent is nil`, () => {
      const actor = new ActorBase(undefined, PARENT_REF.name);
      expect(actor.ref).toMatchObject(PARENT_REF);
    });

    it(`should be a child path if parent is non-nil`, () => {
      const actor = new ActorBase(PARENT_REF, CHILD_REF.name);
      expect(actor.ref).toMatchObject(CHILD_REF);
    });
  });

  describe(`should push a message to message queue when static call/cast is invoked`, () => {
    const payload = { symbol: Symbol(`test`) };

    it(`should push a message when static call is invoked`, () => {
      ActorBase.call(CHILD_REF.uri, PARENT_REF, payload);
      expect(mqPush).toBeCalledWith(CHILD_REF.uri, { from: PARENT_REF, behavior: Behavior.Call, payload });
    });

    it(`should push a message when static cast is invoked`, () => {
      ActorBase.cast(CHILD_REF.uri, PARENT_REF, payload);
      expect(mqPush).toBeCalledWith(CHILD_REF.uri, { from: PARENT_REF, behavior: Behavior.Cast, payload });
    });
  });

  describe(`should push a message to message queue when instance method call/cast is invoked`, () => {
    const payload = { symbol: Symbol(`test`) };

    it(`should push a message when instance method call is invoked`, () => {
      const actor = new ActorBase(undefined, PARENT_REF.name);
      actor.call(CHILD_REF.uri, payload);
      expect(mqPush).toBeCalledWith(CHILD_REF.uri, {
        from: PARENT_REF,
        behavior: Behavior.Call,
        payload,
      });
    });

    it(`should push a message when instance method cast is invoked`, () => {
      const actor = new ActorBase(undefined, PARENT_REF.name);
      actor.cast(CHILD_REF.uri, payload);
      expect(mqPush).toBeCalledWith(CHILD_REF.uri, {
        from: PARENT_REF,
        behavior: Behavior.Cast,
        payload,
      });
    });
  });
});
