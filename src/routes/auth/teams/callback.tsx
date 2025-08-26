import TeamsAuthCallback from '@/pages/auth/teams/callback'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/auth/teams/callback')({
  component: () => <TeamsAuthCallback />,
})

