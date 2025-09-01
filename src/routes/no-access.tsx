import NoAccess from '@/pages/no_access'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/no-access')({
  component: NoAccess,
})


