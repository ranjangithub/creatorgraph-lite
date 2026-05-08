import { redirect } from 'next/navigation'
import { getServerAuth } from '@/lib/auth'
import { getEarlyBirdStatus } from '@/lib/stripe/early-bird'
import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCircle, Brain, Zap, Shield, TrendingUp, MessageCircle, Repeat, ChevronDown, Timer } from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────── */

const pain = [
  { emoji: '😩', title: '"I have no idea what to post next"', body: 'You stare at a blank screen every Monday. You\'ve written hundreds of posts but your brain treats each one like starting from zero.' },
  { emoji: '🔁', title: '"I keep saying the same things"', body: 'Your followers notice before you do. A comment says "didn\'t you write about this 3 months ago?" — and you have no idea.' },
  { emoji: '🤖', title: '"ChatGPT gives me generic garbage"', body: 'AI ideas don\'t know your audience, your voice, or what you\'ve already covered. They\'re not wrong. They\'re just not you.' },
  { emoji: '📉', title: '"I have no idea what actually works"', body: 'You don\'t know which topics resonate, which hooks convert, or what your audience keeps asking that you never answer.' },
]

const features = [
  { icon: Brain,         color: '#4f46e5', bg: '#ede9fe', border: '#c4b5fd', title: 'Your entire content history becomes context', body: 'Every post you\'ve ever written is analysed, tagged, and compiled into a structured knowledge base. Your AI advisor knows your full archive — not just the last 5 posts.' },
  { icon: Repeat,        color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', title: 'Repetition guard', body: 'Before suggesting anything, CreatorGraph checks your full archive. Every idea is tagged: New angle, Sequel, or Repeat. You\'ll know before you write a word.' },
  { icon: MessageCircle, color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc', title: 'Open audience questions surfaced', body: 'Questions your audience keeps asking — extracted from your post context — are tracked as open items. You see the gaps nobody in your niche has answered yet.' },
  { icon: TrendingUp,    color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', title: 'Competitor gap in every idea', body: 'Every suggested idea includes what angle your niche peers are missing. You write things only you can write, from an operator\'s perspective.' },
  { icon: Zap,           color: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Daily briefing in seconds', body: 'Each morning your knowledge graph loads and you get 3–5 ranked content ideas with rationale, hook, audience fit, and validation score.' },
  { icon: Shield,        color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe', title: 'Evidence behind every idea', body: 'No gut-feel content strategy. Every suggestion shows you exactly why — which topics you cover, what signals support it, what the audience pain point is.' },
]

const faq = [
  { q: 'Is my LinkedIn data safe?', a: 'Your export file is processed and stored in your own database instance. We don\'t train on your data or share it.' },
  { q: 'Do I need a LinkedIn Premium account?', a: 'No. The data export works with any LinkedIn account — free or premium. It\'s a standard privacy feature under Settings → Data Privacy.' },
  { q: 'What AI model powers this?', a: 'Anthropic Claude (claude-3-5-haiku). On the Starter plan you bring your own API key. On Pro, credits are included.' },
  { q: 'How long does setup take?', a: 'About 5 minutes. Upload your LinkedIn export, wait ~60 seconds for Claude to build your knowledge graph, then generate your first briefing.' },
  { q: 'Does it work for niches outside tech?', a: 'The knowledge graph pattern is niche-agnostic — it works anywhere you have a content archive. Early testing has been tech-focused but the system is general.' },
  { q: 'This is a new product. What if it doesn\'t work out?', a: 'Fair question. The Starter plan is free and your data export is just a file — you can delete it any time. Pro subscribers can cancel any month. We\'ll give at least 30 days notice of any shutdown.' },
]

/* ─── Sub-components ────────────────────────────────────────── */

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,12,41,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(165,180,252,0.1)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(165,180,252,0.3)' }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 15, letterSpacing: '-0.3px' }}>CreatorGraph</span>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)', letterSpacing: 1 }}>EARLY ACCESS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#pricing" style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, fontWeight: 500, padding: '6px 12px', textDecoration: 'none' }}>Pricing</a>
          <Link href="/sign-in" style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, fontWeight: 500, padding: '6px 12px', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 16px rgba(99,102,241,0.4)' }}>
            Try it free <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: '#6366f1', marginBottom: 14 }}>{children}</div>
}

/* ─── Page ──────────────────────────────────────────────────── */

export default async function MarketingPage() {
  const { clerkId } = await getServerAuth()
  if (clerkId) redirect('/dashboard')

  const eb = await getEarlyBirdStatus()
  const spotsTaken = eb.total - eb.remaining
  const pctTaken   = Math.round((spotsTaken / eb.total) * 100)

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', color: '#1a1a2e', background: '#fff', minHeight: '100vh', lineHeight: 1.65 }}>

      {/* ── EARLY BIRD ANNOUNCEMENT BAR ───────────────────────── */}
      {eb.active && (
        <div style={{ background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', padding: '10px 24px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
            <Timer size={14} color="#fff" />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 14 }}>
              Early Bird — 50% off your first month
            </span>
            <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '2px 10px', borderRadius: 999 }}>
              {eb.remaining} of {eb.total} spots left
            </span>
            <a href="#pricing" style={{ color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'underline', opacity: 0.9 }}>
              Claim offer →
            </a>
          </div>
          <div style={{ maxWidth: 240, margin: '0 auto', background: 'rgba(255,255,255,0.3)', borderRadius: 999, height: 3 }}>
            <div style={{ width: `${pctTaken}%`, height: '100%', background: '#fff', borderRadius: 999, minWidth: 4 }} />
          </div>
        </div>
      )}

      <Nav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #1a1740 100%)', padding: '88px 28px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse at top, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

          {/* Honest badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 40, padding: '6px 16px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
            <span style={{ fontSize: 12, color: '#6ee7b7', fontWeight: 600 }}>Early access — built in public, actively improving</span>
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 5.5vw, 58px)', fontWeight: 900, color: '#fff', lineHeight: 1.12, letterSpacing: '-1.5px', marginBottom: 22 }}>
            Your years of LinkedIn content<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              finally working for you
            </span>
          </h1>

          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'rgba(255,255,255,0.6)', maxWidth: 580, margin: '0 auto 36px', lineHeight: 1.6 }}>
            CreatorGraph turns your post archive into a structured AI memory that generates daily content ideas grounded in your actual voice, audience, and history — not generic trends.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#4f46e5', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.45)', letterSpacing: '-0.2px' }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 24px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              See how it works
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 28px' }}>
            {[
              'Free tier available',
              'Bring your own Anthropic key',
              '5-min setup',
              'Cancel any time',
            ].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(165,180,252,0.55)' }}>
                <CheckCircle size={12} color="#34d399" />
                {p}
              </div>
            ))}
            {eb.active && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
                <Timer size={12} color="#fb923c" />
                <span style={{ background: 'linear-gradient(90deg, #fb923c, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  50% off for first {eb.total} users — {eb.remaining} left
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PAIN SECTION ──────────────────────────────────────── */}
      <section style={{ background: '#fafafa', padding: '80px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <SectionLabel>The problem</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#0f0c29', marginBottom: 12, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
            You're brilliant at what you do.<br />Content strategy is eating you alive.
          </h2>
          <p style={{ fontSize: 16, color: '#4b5563', maxWidth: 540, marginBottom: 48, lineHeight: 1.7 }}>
            It's not a creativity problem. It's a memory and system problem. Every week you face the same friction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {pain.map(({ emoji, title, body }) => (
              <div key={title} style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, padding: '24px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{emoji}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f0c29', marginBottom: 8 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section id="how" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #1a1740 100%)', padding: '80px 28px', borderTop: '1px solid rgba(165,180,252,0.1)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <SectionLabel>How it works</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#fff', marginBottom: 12, letterSpacing: '-0.5px' }}>
            5 minutes to set up.<br />Works on your own data from day one.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(165,180,252,0.6)', marginBottom: 56, maxWidth: 480, lineHeight: 1.7 }}>
            No developer setup. No weekly prompt engineering. Your history does the work.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Export your LinkedIn history', body: 'Go to LinkedIn Settings → Data Privacy → Get a copy of your data. Request your posts archive. You\'ll have a CSV in about 10 minutes.', tag: '~10 min' },
              { n: '02', title: 'Upload — your knowledge graph is built', body: 'Drop the CSV into CreatorGraph. Claude reads every post and extracts topics, hooks, audience questions, voice patterns, and content gaps. Your entire history, structured.', tag: '~60 seconds' },
              { n: '03', title: 'Get your daily briefing', body: 'Each morning, your knowledge graph is compiled into context and you get 3–5 ranked content ideas — each with a hook, audience fit, competitor gap, and validation score.', tag: 'Daily' },
            ].map(({ n, title, body, tag }, i) => (
              <div key={n} style={{ display: 'flex', gap: 22, paddingBottom: 40, position: 'relative' }}>
                {i < 2 && <div style={{ position: 'absolute', left: 22, top: 44, bottom: 0, width: 2, background: 'linear-gradient(180deg, rgba(165,180,252,0.25) 0%, transparent 100%)' }} />}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(165,180,252,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: '#a5b4fc', zIndex: 1 }}>{n}</div>
                <div style={{ paddingTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>{title}</h3>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>{tag}</span>
                  </div>
                  <p style={{ fontSize: 14, color: 'rgba(165,180,252,0.65)', lineHeight: 1.75 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '80px 28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <SectionLabel>What's built</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#0f0c29', marginBottom: 10, letterSpacing: '-0.5px' }}>
            A content advisor that knows your archive
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 48, maxWidth: 520, lineHeight: 1.7 }}>
            These features are live today. Not a roadmap — things you can actually use when you sign up.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {features.map(({ icon: Icon, color, bg, border, title, body }) => (
              <div key={title} className="feature-card" style={{ background: '#fff', border: `1px solid ${border}`, borderRadius: 14, padding: '26px 24px' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon size={20} color={color} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0f0c29', marginBottom: 8, lineHeight: 1.35 }}>{title}</h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" style={{ background: '#fafafa', padding: '80px 28px', borderTop: '1px solid #e0e7ff' }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>
          <SectionLabel>Pricing</SectionLabel>
          <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, color: '#0f0c29', marginBottom: 10, letterSpacing: '-0.5px' }}>
            Simple, honest pricing
          </h2>

          {eb.active ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 18px', marginBottom: 32 }}>
              <Timer size={16} color="#ea580c" />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#c2410c' }}>
                Early Bird: 50% off your first month — {eb.remaining} of {eb.total} spots remaining
              </span>
            </div>
          ) : (
            <p style={{ fontSize: 16, color: '#4b5563', marginBottom: 48, maxWidth: 460, lineHeight: 1.7 }}>
              Start free. Upgrade only if it&apos;s worth it. No dark patterns, no annual lock-in pushed at checkout.
            </p>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'start' }}>
            {/* Free */}
            <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 18, padding: '36px 30px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Free</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 900, color: '#0f0c29', letterSpacing: '-2px' }}>$0</span>
                <span style={{ fontSize: 15, color: '#6b7280' }}>/month</span>
              </div>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28, lineHeight: 1.65 }}>20 AI generations per month. No credit card required. Everything is fully functional to start.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {[
                  'Post history import',
                  'Full knowledge graph — topics, hooks, audience questions',
                  'Daily briefing — 3–5 ideas per day',
                  'Repetition guard',
                  '20 AI generations / month',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle size={14} color="#6366f1" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/sign-up" style={{ display: 'block', textAlign: 'center', padding: '12px', background: '#fff', border: '1.5px solid #4f46e5', color: '#4f46e5', borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                Start free
              </Link>
            </div>

            {/* Creator — highlighted with early bird if active */}
            <div style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 100%)', border: eb.active ? '2px solid #f97316' : '1px solid rgba(165,180,252,0.15)', borderRadius: 18, padding: '36px 30px', position: 'relative' }}>

              {eb.active && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #f97316, #ea580c)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                  50% off — Early Bird
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 8 }}>Creator</div>

              {eb.active ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>$14</span>
                    <span style={{ fontSize: 15, color: 'rgba(165,180,252,0.55)' }}>first month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                    <span style={{ fontSize: 14, color: 'rgba(165,180,252,0.45)', textDecoration: 'line-through' }}>$29/mo</span>
                    <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, background: 'rgba(251,146,60,0.15)', padding: '2px 8px', borderRadius: 999 }}>then $29/mo</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>$29</span>
                  <span style={{ fontSize: 15, color: 'rgba(165,180,252,0.55)' }}>/month</span>
                </div>
              )}

              <p style={{ fontSize: 13, color: 'rgba(165,180,252,0.6)', marginBottom: 28, lineHeight: 1.65 }}>150 AI generations/month. Bring your own key for unlimited usage. For creators using this daily.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {[
                  'Everything in Free',
                  '150 AI generations / month',
                  'Bring your own API key (unlimited)',
                  'Full prompt vault',
                  'Hook performance analytics',
                  'Priority support',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                style={{
                  display: 'block', textAlign: 'center', padding: '13px',
                  background: eb.active ? 'linear-gradient(90deg, #f97316, #ea580c)' : '#4f46e5',
                  color: '#fff', borderRadius: 9, fontSize: 14, fontWeight: 700,
                  textDecoration: 'none', boxShadow: eb.active ? '0 0 20px rgba(249,115,22,0.4)' : '0 0 20px rgba(99,102,241,0.4)',
                }}
              >
                {eb.active ? `Claim 50% off — ${eb.remaining} spots left` : 'Get Creator'}
              </Link>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(165,180,252,0.35)', marginTop: 10 }}>
                {eb.active ? 'Discount applied automatically at checkout' : 'Cancel any time from your dashboard'}
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/pricing" style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
              See all plans including Creator Pro and Enterprise →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '80px 28px', borderTop: '1px solid #e0e7ff' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <SectionLabel>Questions</SectionLabel>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: '#0f0c29', marginBottom: 40, letterSpacing: '-0.5px' }}>Honest answers</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {faq.map(({ q, a }) => (
              <details key={q} style={{ background: '#fafbff', border: '1px solid #e0e7ff', borderRadius: 12, overflow: 'hidden' }}>
                <summary style={{ padding: '18px 22px', fontSize: 14, fontWeight: 700, color: '#0f0c29', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {q} <ChevronDown size={16} color="#6366f1" />
                </summary>
                <p style={{ padding: '14px 22px 18px', fontSize: 14, color: '#4b5563', lineHeight: 1.75, borderTop: '1px solid #e0e7ff', margin: 0 }}>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 55%, #24243e 100%)', padding: '96px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 580, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-1px', lineHeight: 1.15 }}>
            Stop starting from scratch.<br />
            <span style={{ background: 'linear-gradient(90deg, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Every post should build on the last.
            </span>
          </h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', marginBottom: 14, lineHeight: 1.65 }}>
            This is early software. It works, and it'll get better — especially with early users who care enough to give feedback.
          </p>
          {eb.active ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, padding: '8px 18px', marginBottom: 32 }}>
              <Timer size={14} color="#fb923c" />
              <span style={{ fontSize: 13, color: '#fb923c', fontWeight: 700 }}>
                Early bird: 50% off your first month — {eb.remaining} spots left
              </span>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'rgba(165,180,252,0.45)', marginBottom: 40 }}>
              Free tier available. No credit card. Built in public.
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: eb.active ? 0 : 0 }}>
            <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '17px 36px', background: '#4f46e5', color: '#fff', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.45)', letterSpacing: '-0.2px' }}>
              Get started free <ArrowRight size={18} />
            </Link>
            {eb.active && (
              <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '17px 36px', background: 'linear-gradient(90deg, #f97316, #ea580c)', color: '#fff', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 30px rgba(249,115,22,0.4)', letterSpacing: '-0.2px' }}>
                Claim 50% off <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer style={{ background: '#0f0c29', borderTop: '1px solid rgba(165,180,252,0.08)', padding: '36px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={12} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>CreatorGraph</span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(165,180,252,0.2)' }}>Built with Next.js · Drizzle · Supabase · Anthropic Claude</p>
        </div>
      </footer>

    </div>
  )
}
