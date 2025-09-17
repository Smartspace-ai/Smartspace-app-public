export type AccessLevel = 'Read' | 'Write';

export interface VariableConfig {
  access: AccessLevel;
  schema: any; // JSON Schema
}

export interface WorkspaceLike {
  variables?: Record<string, VariableConfig>;
}

export interface ChatVariablesFormProps {
  workspace: WorkspaceLike;     // you can pass your real Workspace (it’s compatible)
  threadId: string;
}

export interface ChatVariablesFormRef {
  hasChanges: () => boolean;
  getChangedVariables: () => Record<string, any>;
  getCurrentVariables: () => Record<string, any>;
  saveChangedVariables: () => Promise<void>;
}
