export type AccessLevel = 'Read' | 'Write';

export interface VariableConfig {
  access: AccessLevel;
  // JSON Schema for this variable (JSONForms compatible)
  schema: import('@jsonforms/core').JsonSchema7;
}

export interface WorkspaceLike {
  variables?: Record<string, VariableConfig>;
}

export interface ChatVariablesFormProps {
  workspace: WorkspaceLike;
  threadId: string;
}

export interface ChatVariablesFormRef {
  // kept for compatibility; not strictly needed in this minimal version
  hasChanges: () => boolean;
  getChangedVariables: () => Record<string, unknown>;
  getCurrentVariables: () => Record<string, unknown>;
  saveChangedVariables: () => Promise<void>;
}
