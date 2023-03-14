export const ResourceBindingKey = {
  ResourceBindingRegister: Symbol('resource-binding:register'),
}

export const ResourceBindingRegister: ClassDecorator = (target: object) => {
  Reflect.defineMetadata(ResourceBindingKey.ResourceBindingRegister, true, target)
}
