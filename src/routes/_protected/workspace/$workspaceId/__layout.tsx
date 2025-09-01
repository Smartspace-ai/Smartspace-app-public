import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/workspace/$workspaceId/__layout')({
  component: () => <Outlet />,
})


