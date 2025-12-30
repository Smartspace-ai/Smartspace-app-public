import { createFileRoute } from '@tanstack/react-router';

import AuthFailed from '@/pages/AuthFailed';

export const Route = createFileRoute('/auth-failed')({
  component: AuthFailed,
});


