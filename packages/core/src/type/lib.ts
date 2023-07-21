declare module 'read' {
  function Read(options: Options): Promise<string>

  interface Options {
    prompt?: string
    silent?: boolean
    replace?: string
    timeout?: number
    default?: string
    edit?: boolean
    terminal?: boolean
    input?: WritableStream
    output?: ReadableStream
  }

  export = Read
}
