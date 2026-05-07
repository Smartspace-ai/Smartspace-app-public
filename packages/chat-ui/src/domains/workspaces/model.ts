export type VariableAccess = 'Read' | 'Write';
export type Variables = Record<
  string,
  { schema: Record<string, unknown>; access: VariableAccess }
>;

export type MentionUser = {
  id: string;
  displayName: string;
  initials: string; // always computed, never null/undefined in the model
};

export type Workspace = {
  id: string;
  name: string;
  tags: string[]; // normalized default []

  showSources: boolean; // normalized default false
  dataSpaces: unknown[]; // normalized default []

  // Identity / timestamps stay optional — the backend genuinely omits these
  // for system-seeded workspaces, and consumers benefit from being able to
  // distinguish "we don't know" from "default value".
  createdByUserId?: string;
  createdAt?: Date;
  modifiedByUserId?: string;
  modifiedAt?: Date;

  favorited: boolean; // normalized default false

  summary: string; // normalized default ''
  firstPrompt: string; // normalized default ''

  // Schema-shaped fields stay optional — empty object isn't a meaningful
  // default for "no schema configured".
  outputSchema?: unknown;
  inputs?: unknown;

  isPromptAndResponseLoggingEnabled: boolean; // normalized default false

  variables: Variables; // normalized default {}

  // Sandbox thread is genuinely optional — many workspaces don't have one.
  sandBoxThreadId?: string;

  supportsFiles: boolean; // normalized default false

  avatarName: string; // computed from name if missing
};
