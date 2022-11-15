import findUp from 'find-up';
import { KuaiError } from './errors';
import { ERRORS } from './errors-list';

const JS_CONFIG_FILENAME = 'kuai.config.js';
const TS_CONFIG_FILENAME = 'kuai.config.ts';

export function isCwdInsideProject(): boolean {
  return findUp.sync(TS_CONFIG_FILENAME) !== null || findUp.sync(JS_CONFIG_FILENAME) !== null;
}

export function getUserConfigPath(): string {
  const tsConfigPath = findUp.sync(TS_CONFIG_FILENAME);
  if (tsConfigPath) {
    return tsConfigPath;
  }

  const pathToConfigFile = findUp.sync(JS_CONFIG_FILENAME);
  if (!pathToConfigFile) {
    throw new KuaiError(ERRORS.GENERAL.NOT_INSIDE_PROJECT);
  }

  return pathToConfigFile;
}
