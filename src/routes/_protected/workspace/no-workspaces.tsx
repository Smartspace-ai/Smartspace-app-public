// src/routes/_protected/workspace/no-workspaces.tsx
import { createFileRoute } from '@tanstack/react-router'

import NoWorkspacesAvailable from '@/pages/no_workspaces_available'

export const Route = createFileRoute('/_protected/workspace/no-workspaces')({
  component: NoWorkspacesAvailable,
})
