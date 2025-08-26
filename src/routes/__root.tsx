// src/routes/__root.tsx
import AppProviders from '@/app/app'
import { Outlet, createRootRoute } from '@tanstack/react-router'

export default function Root() {
  return (
    <AppProviders>
      <div className="min-h-screen flex flex-col">
        <Outlet />
      </div>
    </AppProviders>
  )
}

export const Route = createRootRoute({
  component: Root,
})
