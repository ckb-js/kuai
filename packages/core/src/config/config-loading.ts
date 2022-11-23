import path from 'node:path';
import { KuaiConfig, KuaiArguments } from '../type';
import { getUserConfigPath } from '../project-structure';
import { DEFAULT_KUAI_ARGUMENTS } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function importCsjOrEsModule(filePath: string): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require(filePath);
  return imported.default !== undefined ? imported.default : imported;
}

export function resolveConfigPath(configPath: string | undefined): string | undefined {
  if (configPath === undefined) {
    return getUserConfigPath();
  }

  if (!path.isAbsolute(configPath)) {
    configPath = path.join(process.cwd(), configPath);
    configPath = path.normalize(configPath);
  }

  return configPath;
}

export async function loadConfigAndTasks(args: KuaiArguments = {}): Promise<KuaiConfig> {
  const configPath = resolveConfigPath(args.configPath);

  await import('../builtin-tasks');

  let userConfig;

  if (configPath) {
    userConfig = importCsjOrEsModule(configPath);
  }

  return {
    ...userConfig,
    kuaiArguments: {
      ...DEFAULT_KUAI_ARGUMENTS,
      ...args,
      configPath,
    },
  };
}
