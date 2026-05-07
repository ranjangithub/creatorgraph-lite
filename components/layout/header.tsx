import { UserButton } from '@clerk/nextjs'

interface HeaderProps {
  title:       string
  description?: string
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-14 border-b bg-white flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <UserButton afterSignOutUrl="/" />
    </header>
  )
}
