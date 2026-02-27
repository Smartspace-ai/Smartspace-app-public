import { Logo } from '@/assets/logo'

type TeamsLoaderProps = {
  message?: string
}

export function TeamsLoader({ message = 'Loading…' }: TeamsLoaderProps) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-5">
        <div className="opacity-90">
          <Logo />
        </div>
        <div className="flex items-center gap-3 text-gray-700">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-700" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </div>
  )
}

export default TeamsLoader


