import { getOrCreateDbUser, getCurrentUser } from '@/lib/auth'
import { MODEL } from '@/lib/anthropic/client'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { getContentCount } from '@/lib/db/queries/content'
import { getMemoryCount } from '@/lib/db/queries/memory'
import { getUserHookPerformance } from '@/lib/db/queries/analytics'
import { UserButton } from '@clerk/nextjs'
import { MOCK_AUTH } from '@/lib/auth'
import { NicheSettings }   from '@/components/settings/niche-settings'
import { PromptVault }     from '@/components/settings/prompt-vault'
import { LLMSettings }     from '@/components/settings/llm-settings'
import { BillingSettings } from '@/components/billing/billing-settings'

const stackItems = [
  { label: 'Auth',              value: 'Clerk' },
  { label: 'Database',         value: 'Supabase (Postgres) + Drizzle ORM' },
  { label: 'AI',               value: `Anthropic Claude (${MODEL})` },
  { label: 'Framework',        value: 'Next.js 15 App Router' },
]

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e0e7ff',
  borderRadius: 14,
  overflow: 'hidden',
}

const cardHeaderStyle: React.CSSProperties = {
  padding: '14px 22px',
  borderBottom: '1px solid #f0f4ff',
  background: '#fafbff',
}

const cardBodyStyle: React.CSSProperties = {
  padding: '18px 22px',
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const [user, clerkUser, params] = await Promise.all([
    getOrCreateDbUser(),
    getCurrentUser(),
    searchParams,
  ])
  if (!user) redirect('/sign-in')
  const showUpgradeSuccess = params?.upgraded === 'true'

  const [contentCount, memoryCount, hookPerf] = await Promise.all([
    getContentCount(user.id),
    getMemoryCount(user.id),
    getUserHookPerformance(user.id),
  ])

  return (
    <>
      <Header title="Settings" description="Account and data preferences" />

      <div style={{ flex: 1, padding: '28px', maxWidth: 560 }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>Settings</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Account */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Account</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Managed by Clerk</div>
            </div>
            <div style={cardBodyStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#fafbff', borderRadius: 10, border: '1px solid #e0e7ff' }}>
                {!MOCK_AUTH && <UserButton />}
                {MOCK_AUTH && (
                  <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                    {clerkUser?.fullName?.[0] ?? 'M'}
                  </div>
                )}
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#0f0c29' }}>{clerkUser?.fullName ?? 'Anonymous'}</p>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{clerkUser?.primaryEmailAddress?.emailAddress}</p>
                  {MOCK_AUTH && (
                    <span style={{ display: 'inline-block', marginTop: 5, fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>mock mode</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Data */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Your data</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>What CreatorGraph knows about you</div>
            </div>
            <div style={{ ...cardBodyStyle, padding: 0 }}>
              {[
                { label: 'Posts imported', value: contentCount },
                { label: 'Memory entries', value: memoryCount },
              ].map(({ label, value }, i, arr) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: i < arr.length - 1 ? '1px solid #f0f4ff' : 'none' }}>
                  <span style={{ fontSize: 14, color: '#4b5563' }}>{label}</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#4f46e5', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Billing */}
          <BillingSettings showUpgradeSuccess={showUpgradeSuccess} />

          {/* AI Provider */}
          <LLMSettings />

          {/* Prompt Vault */}
          <PromptVault />

          {/* Niche benchmarking */}
          <NicheSettings
            userId={user.id}
            currentNiche={user.niche ?? ''}
            currentShare={user.shareForBenchmark ?? false}
          />

          {/* Hook performance */}
          {hookPerf.length > 0 && (
            <div style={cardStyle}>
              <div style={cardHeaderStyle}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Your hook performance</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Engagement score by hook type — updated nightly</div>
              </div>
              <div style={{ ...cardBodyStyle, padding: 0 }}>
                {hookPerf.map((h, i) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: i < hookPerf.length - 1 ? '1px solid #f0f4ff' : 'none' }}>
                    <div style={{ width: 80, fontSize: 12, fontWeight: 700, color: '#374151', textTransform: 'capitalize' }}>
                      {h.hookType.replace(/_/g, ' ')}
                    </div>
                    <div style={{ flex: 1, height: 6, background: '#e0e7ff', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${h.avgScore ?? 0}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', borderRadius: 3 }} />
                    </div>
                    <div style={{ width: 48, textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#4f46e5', fontVariantNumeric: 'tabular-nums' }}>
                      {Math.round(h.avgScore ?? 0)}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{h.postCount} post{h.postCount !== 1 ? 's' : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stack */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Stack</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>How this app is built — tutorial reference</div>
            </div>
            <div style={{ ...cardBodyStyle, padding: 0 }}>
              {stackItems.map(({ label, value }, i) => (
                <div key={label} style={{ padding: '12px 22px', borderBottom: i < stackItems.length - 1 ? '1px solid #f0f4ff' : 'none' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
