import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import webApi from '@/domains/auth/axios-setup'
import { useActiveWorkspace } from '@/hooks/use-workspaces'
import { useEffect, useState } from 'react'

export default function NoWorkspacesAvailable() {
  const { isInTeams, getAccessToken } = useAuth()
  const { error: workspacesError } = useActiveWorkspace()

  const [token, setToken] = useState<string | null>(null)
  const [tokenErr, setTokenErr] = useState<string | null>(null)
  const apiBaseUrl = (webApi.defaults?.baseURL as string | undefined) || ''
  const [pingResult, setPingResult] = useState<{ status: 'unknown' | 'ok' | 'blocked'; detail?: string }>({ status: 'unknown' })

  // Fetch a token to display for debugging
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const scopes = isInTeams
          ? ['api://e3f39d90-9235-435e-ba49-681727352613/smartspaceapi.chat.access']
          : (import.meta.env.VITE_CLIENT_SCOPES?.split(',') ?? []).filter(Boolean)
        const t = await getAccessToken(scopes)
        if (mounted) setToken(t)
      } catch (e) {
        if (mounted) setTokenErr(String(e))
      }
    })()
    return () => { mounted = false }
  }, [isInTeams, getAccessToken])

  // Quick reachability probe (network-only)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!apiBaseUrl) return
      try {
        const res = await fetch(apiBaseUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
        if (!cancelled) setPingResult({ status: 'ok', detail: res.type === 'opaque' ? 'reachable (opaque)' : 'reachable' })
      } catch (e) {
        if (!cancelled) setPingResult({ status: 'blocked', detail: String(e) })
      }
    })()
    return () => { cancelled = true }
  }, [apiBaseUrl])

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
          <div className="font-medium mb-2">Diagnostics</div>
          <div className="grid grid-cols-2 gap-2 mb-3 opacity-90">
            <div><span className="font-semibold">isInTeams:</span> {String(isInTeams)}</div>
            <div><span className="font-semibold">navigator.onLine:</span> {String(navigator.onLine)}</div>
            <div className="col-span-2"><span className="font-semibold">origin:</span> {window.location.origin}</div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">API Base URL</div>
              {apiBaseUrl ? (
                <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(apiBaseUrl) } catch (_e) { /* ignore */ } }}>Copy</Button>
              ) : null}
            </div>
            <div className="rounded border bg-gray-50 p-2 overflow-auto break-all">{apiBaseUrl || '(empty)'}</div>
            <div className="mt-1"><span className="font-semibold">Ping:</span> {pingResult.status}{pingResult.detail ? ` — ${pingResult.detail}` : ''}</div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Token</div>
              {token ? (
                <Button size="sm" variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(token) } catch (_e) { /* ignore */ } }}>Copy</Button>
              ) : null}
            </div>
            <div className="rounded border bg-gray-50 p-2 max-h-32 overflow-auto break-all">{token || '(none)'}</div>
            {tokenErr ? <div className="mt-1 text-red-600">{tokenErr}</div> : null}
          </div>

          {workspacesError ? (
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">Last Workspaces Error</div>
              <Button size="sm" variant="outline" onClick={async () => { try { const text = typeof workspacesError === 'string' ? workspacesError : JSON.stringify(workspacesError as unknown as Record<string, unknown>, null, 2); await navigator.clipboard.writeText(text) } catch (_e) { /* ignore */ } }}>Copy</Button>
            </div>
          ) : null}
          {workspacesError ? (
            <pre className="whitespace-pre-wrap break-words rounded border bg-gray-50 p-2 max-h-40 overflow-auto">
{typeof workspacesError === 'string' ? workspacesError : JSON.stringify(workspacesError as unknown as Record<string, unknown>, null, 2)}
            </pre>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
