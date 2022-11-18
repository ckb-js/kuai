import { task, KuaiConfig } from '@kuai/core';

task('demo-task2')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.log('demo-task2');
  });

const config: KuaiConfig = {
  kuai: '0.0.1',
};

export default config;
