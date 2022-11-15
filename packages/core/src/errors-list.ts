export interface ErrorDescriptor {
  code: string;
  message: string;
}

export const ERRORS = {
  ARGUMENTS: {
    UNRECOGNIZED_TASK: {
      code: 'UNRECOGNIZED_TASK',
      message: 'Unrecognized task %task%',
    },
    MISSING_TASK_ARGUMENT: {
      code: 'MISSING_TASK_ARGUMENT',
      message: "The '%param%' parameter expects a value, but none was passed.",
    },
  },
  INTERNAL: {
    TEMPLATE_INVALID_VARIABLE_NAME: {
      code: 'TEMPLATE_INVALID_VARIABLE_NAME',
      message: 'Variable names can only include ascii letters and numbers, and start with a letter, but got %var%',
    },
    TEMPLATE_VARIABLE_TAG_MISSING: {
      code: 'TEMPLATE_VARIABLE_TAG_MISSING',
      message: "Variable %var%'s tag not present in the template",
    },
    TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG: {
      code: 'TEMPLATE_VALUE_CONTAINS_VARIABLE_TAG',
      message: "Template values can't include variable tags, but %var%'s value includes one",
    },
  },
};
