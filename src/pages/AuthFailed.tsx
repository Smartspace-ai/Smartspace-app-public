import { Button } from '@/shared/ui/mui-compat/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/mui-compat/card'

export default function AuthFailed() {
  const retry = () => {
    try {
      try { sessionStorage.removeItem('teamsAuthFailed') } catch { /* ignore */ }
      const search = new URLSearchParams(window.location.search)
      const redirect = search.get('redirect') || '/'
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <div className="fixed inset-0 z-[1] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl">
        <CardHeader className="items-center text-center space-y-4 px-6 pt-10 pb-6">
          <CardTitle className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200">Authentication failed</CardTitle>
          <CardDescription className="text-sm md:text-base max-w-md mx-auto text-gray-500 dark:text-gray-400">
            We couldn’t complete sign-in. Please try again. If the problem persists, contact your administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-10 flex justify-center">
          <Button onClick={retry}>Try again</Button>
        </CardContent>
      </Card>
    </div>
  )
}


