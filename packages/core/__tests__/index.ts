import { describe, expect, test } from '@jest/globals';

import { RuntimeEnvironment } from '../src/type';
import { KuaiRuntimeEnvironment } from '../src/runtime';
import { SimpleTask } from '../src/task';
import { fakeType } from '../src/params';

declare module '../src/type/runtime' {
  export interface RuntimeEnvironment {
    wheel?: {
      type: string;
    };
    engine?: {
      power: number;
      type: string;
    };
  }
}

describe('kuai task system', () => {
  const buildWheelTask = new SimpleTask('BUILD_WHEEL')
    .addParam('wheelType', 'Type of wheel to build', 'steel', fakeType)
    .setAction<{ wheelType: string }>(async ({ wheelType }, env, runSuper) => {
      if (wheelType === 'steel') {
        env.wheel = {
          type: wheelType,
        };
      }

      if (runSuper.isDefined) {
        await runSuper();
      }
    });

  const buildEngineTask = new SimpleTask('BUILD_ENGINE')
    .addParam('engineType', 'Type of engine to build', 'v8', fakeType)
    .addParam('power', 'Power of engine to build', 1000, fakeType)
    .setAction<{ engineType: string; power: number }>(async ({ engineType, power }, env, runSuper) => {
      env.engine = {
        power,
        type: engineType,
      };

      if (runSuper.isDefined) {
        await runSuper();
      }
    });

  const buildCarTask = new SimpleTask('BUILD_CAR')
    .addParam('wheelType', 'Type of wheel to build', 'steel', fakeType)
    .addParam('engineType', 'Type of engine to build', 'v8', fakeType)
    .setAction<{ engineType: string; wheelType: string }>(async (args, env) => {
      env.run('BUILD_WHEEL', { wheelType: args.wheelType });
      env.run('BUILD_ENGINE', { engineType: args.engineType });
    });

  const buildSkidProofWheelTask = new SimpleTask('BUILD_WHEEL').setAction<{ wheelType: string }>(
    async ({ wheelType }, env, runSuper) => {
      if (wheelType === 'skid_proof') {
        env.wheel = {
          type: wheelType,
        };
      }

      if (runSuper.isDefined) {
        await runSuper();
      }
    },
  );

  const environment = new KuaiRuntimeEnvironment(
    {},
    [buildWheelTask, buildEngineTask, buildCarTask, buildSkidProofWheelTask],
    [],
    // eslint-disable-next-line
  ) as any as RuntimeEnvironment;

  test('should build car with skid proof wheel', () => {
    environment.run('BUILD_CAR', { wheelType: 'skid_proof', engineType: 'v8' });
    expect(environment.wheel?.type).toBe('skid_proof');
  });
});
