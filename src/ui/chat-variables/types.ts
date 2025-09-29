export type AccessLevel = 'Read' | 'Write';

export interface VariableConfig {
  access: AccessLevel;
  schema: any; // JSON Schema
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
  getChangedVariables: () => Record<string, any>;
  getCurrentVariables: () => Record<string, any>;
  saveChangedVariables: () => Promise<void>;
}
