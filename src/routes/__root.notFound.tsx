import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/__root/notFound')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-2">Page not found</h1>
      <p className="mb-4">The page you are looking for does not exist.</p>
      <Link to="/workspace" className="text-blue-600 underline">Go to workspaces</Link>
    </div>
  )
}
