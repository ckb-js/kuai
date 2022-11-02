## kuai task system design

### design target
The `kuai` project needs a task system to support inject dapp template / run node / deploy contract etc...

To achieve the above goals, the task system needs to have the following features
 - dynamically load tasks to facilitate expansion/new custom tasks
 - The task runtime needs to be like an onion model to implement pre/post-processing operations when multiple task handlers are used
 - has a `Context`, which may have config/anything, usually the context is a singleton (providing the ability to create multiple contexts manually)
 - task can be executed directly from the cli via `npx kuai TASK_NAME`
 - task can be executed manually in the code to facilitate doing e2e tests
 - support subtask

### use case

#### custom-task
```ts
// custom-task.ts
Import { Task } from 'kuai/xxx'

const task = new Task(TASK_NAME)
task
  .addOption()
  .action(async (args, context, next) => {
  // do something…
  })
```

#### use context on anything (task handler / test case / code file)
```ts
// func.ts
Import { Context } from 'kuai/xxx';

func() {
  ctx = Context.getContext();

  dosomething(ctx.xxx)

  ctx.doSomething(…)
}
```

#### extends context
```ts
// todo
```


#### dyanamic load custom-task to kuai task system
``` ts
// todo
```

### Architecture
 - Cli: integrate task into cli, parse args / match task, use `Runtime` to execute task
 - Context: can get/set some data in the context
 - Runtime: can dynamically mount task handler, run task, and check args is valid
 - Task: contains description of task args / description of task itself / task handle

#### interfaces
// todo

### implement

 - [ ] inject dapp templates
 - [ ] run tests
 - [ ] compile
 - [ ] deploy
 - [ ] build a docs website for the project

