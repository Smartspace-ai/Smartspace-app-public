import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'

export default function NoWorkspacesAvailable() {

  return (
    <div className="fixed inset-0 z-[1] flex items-center justify-center px-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-xl">
        <CardHeader className="items-center text-center space-y-4 px-6 pt-10 pb-16">
          <CardTitle className="text-2xl md:text-3xl text-gray-700 dark:text-gray-200">No Workspaces Available</CardTitle>
          <CardDescription className="text-sm md:text-base max-w-md mx-auto text-gray-500 dark:text-gray-400">
            It looks like you don't have access to any workspaces yet. Please contact your administrator
            to get access to a workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 text-[11px] text-gray-600 dark:text-gray-300">
        </CardContent>
      </Card>
    </div>
  )
}
