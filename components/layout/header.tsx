import { UserButton } from '@clerk/nextjs'
import { MOCK_AUTH, MOCK_USER_NAME } from '@/lib/auth'

interface HeaderProps {
  title:        string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      {MOCK_AUTH ? (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {MOCK_USER_NAME[0]}
          </div>
          <span className="text-xs text-slate-400">mock mode</span>
        </div>
      ) : (
        <UserButton afterSignOutUrl="/" />
      )}
    </header>
  )
}
