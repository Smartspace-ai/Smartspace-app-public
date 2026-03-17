export type VariableAccess = 'Read' | 'Write';
export type Variables = Record<string, { schema: Record<string, unknown>; access: VariableAccess }>;

export type MentionUser = {
  id: string;
  displayName: string;
  initials: string; // always computed, never null/undefined in the model
};

export type Workspace = {
  id: string;
  name: string;
  tags?: string[];

  showSources?: boolean;
  dataSpaces?: unknown[];

  createdByUserId?: string;
  createdAt?: Date;       // normalized to Date (optional if backend omits)

  modifiedByUserId?: string;
  modifiedAt?: Date;

  favorited: boolean;     // normalized default false

  summary?: string;
  firstPrompt?: string;

  outputSchema?: unknown;
  isPromptAndResponseLoggingEnabled?: boolean;
  inputs?: unknown;

  variables: Variables;   // normalized default {}

  sandBoxThreadId?: string;
  supportsFiles?: boolean;

  avatarName: string;     // computed from name if missing
};
