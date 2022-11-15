import path from 'path';
import { KuaiConfig, KuaiArguments } from '../type';
import { getUserConfigPath } from '../project-structure';

// eslint-disable-next-line
function importCsjOrEsModule(filePath: string): any {
  // eslint-disable-next-line
  const imported = require(filePath);
  return imported.default !== undefined ? imported.default : imported;
}

export function resolveConfigPath(configPath: string | undefined): string {
  if (configPath === undefined) {
    configPath = getUserConfigPath();
  } else {
    if (!path.isAbsolute(configPath)) {
      configPath = path.join(process.cwd(), configPath);
      configPath = path.normalize(configPath);
    }
  }
  return configPath;
}

export function loadConfigAndTasks(args: KuaiArguments = {}): { config: KuaiConfig } {
  const configPath = resolveConfigPath(args.config);

  require('../builtin-tasks');

  const config = importCsjOrEsModule(configPath);

  return { config };
}
