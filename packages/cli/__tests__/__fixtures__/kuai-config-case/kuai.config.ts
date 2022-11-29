import { task, subtask, KuaiConfig } from '@kuai/core'

task('demo-task1')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.log('demo-task1')
  })

task('demo-task2')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.log('demo-task2')
  })

subtask('demo-task2:sub').setAction(() => {
  console.log('subtask')
})

const config: KuaiConfig = {}

export default config
