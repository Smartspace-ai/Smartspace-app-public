import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearch } from '@tanstack/react-router'

type NoAccessSearch = {
  reason?: string
  error?: unknown
  redirect?: string
}

export default function NoAccess() {
  const search = useSearch({ from: '/no-access' }) as NoAccessSearch

  const error = search?.error ?? null
  const reason = search?.reason ?? 'Unknown'
  const timestamp = new Date().toISOString()

  return (
    <div className="fixed inset-0 z-[1] flex items-center justify-center px-4">
      <Card className="w-full max-w-3xl rounded-2xl shadow-xl">
        <CardHeader className="items-center text-center space-y-3 px-6 pt-10 pb-6">
          <CardTitle className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200">Access Denied</CardTitle>
          <CardDescription className="text-sm md:text-base max-w-lg mx-auto text-gray-500 dark:text-gray-400">
            Authentication failed or you do not have access. This page shows verbose diagnostic details to assist debugging.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-10">
          <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            <div><span className="font-medium">Reason:</span> {String(reason)}</div>
            <div><span className="font-medium">Timestamp:</span> {timestamp}</div>
          </div>

          {error ? (
            <pre className="whitespace-pre-wrap break-words text-xs bg-gray-50 dark:bg-gray-900/50 border rounded p-3 max-h-80 overflow-auto">
{JSON.stringify(error, null, 2)}
            </pre>
          ) : (
            <div className="text-xs text-gray-500">No additional error details provided.</div>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button onClick={() => window.location.replace('/login')}>Go to Sign in</Button>
            <Button variant="outline" onClick={() => window.location.replace('/')}>Back to Home</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}




