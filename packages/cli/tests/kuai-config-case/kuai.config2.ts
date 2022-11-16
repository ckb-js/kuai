import { task, KuaiConfig } from '@kuai/core';

task('demo-task')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.log('action');
  });

const config: KuaiConfig = {
  kuai: '0.0.1',
};

export default config;
