import { task, subtask, KuaiConfig, paramTypes } from '@kuai/core'

task('demo-task1')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.info('demo-task1')
  })

task('demo-task2')
  .addParam('paramA', 'a custom param', 'default value')
  .setAction(() => {
    console.info('demo-task2')
  })

task('boolean-param-task')
  .addParam('test', '', false, paramTypes.boolean)
  .setAction((args) => {
    console.info(args.test)
  })

task('required-task')
  .addParam('paramA', 'a required param', undefined, paramTypes.number, false)
  .setAction(() => {
    console.info('required-task')
  })

task('variadic-task')
  .addParam('variadicParam', 'a variadic param', undefined, paramTypes.number, false, true)
  .setAction((args) => {
    console.info(args)
  })

subtask('demo-task2:sub').setAction(() => {
  console.info('subtask')
})

const config: KuaiConfig = {}

export default config
