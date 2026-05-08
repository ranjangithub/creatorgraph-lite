import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isMock = process.env.MOCK_AUTH === 'true'
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa' }}>
      <Sidebar isMock={isMock} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>{children}</main>
    </div>
  )
}
