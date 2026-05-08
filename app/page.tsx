import { redirect } from 'next/navigation'
import { getServerAuth } from '@/lib/auth'
import { getEarlyBirdStatus } from '@/lib/stripe/early-bird'
import Link from 'next/link'
import { ArrowRight, Sparkles, CheckCircle, Brain, Zap, Shield, TrendingUp, MessageCircle, Repeat, ChevronDown, Globe, BookOpen, BarChart2, FileText, Users, Layers } from 'lucide-react'

/* ─── Data ─────────────────────────────────────────────────── */

const pain = [
  { emoji: '😩', title: '"I have no idea what to post next"', body: 'You stare at a blank screen every Monday. You\'ve written hundreds of posts but your brain treats each one like starting from zero.' },
  { emoji: '🔁', title: '"I keep saying the same things"', body: 'Your followers notice before you do. A comment says "didn\'t you write about this 3 months ago?" — and you have no idea.' },
  { emoji: '🤖', title: '"ChatGPT gives me generic garbage"', body: 'AI ideas don\'t know your audience, your voice, or what you\'ve already covered. They\'re not wrong. They\'re just not you.' },
  { emoji: '📉', title: '"I have no idea what actually works"', body: 'You don\'t know which topics resonate, which hooks convert, or what your audience keeps asking that you never answer.' },
]

const features = [
  { icon: Brain,         color: '#4f46e5', bg: '#ede9fe', border: '#c4b5fd', title: 'Your entire content history becomes context', body: 'Every post you\'ve ever written is analysed, tagged, and compiled into a structured knowledge graph. Your AI advisor knows your full archive — not just the last 5 posts.' },
  { icon: Repeat,        color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', title: 'Repetition guard built in', body: 'Before suggesting anything, CreatorGraph checks your full archive and today\'s already-suggested ideas. Every idea is de-duplicated. You\'ll never be told to write the same thing twice.' },
  { icon: MessageCircle, color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc', title: 'Audience questions surfaced automatically', body: 'Questions your readers keep asking — extracted from your post context — are tracked as open items. You see the gaps nobody in your niche has answered yet.' },
  { icon: Globe,         color: '#0891b2', bg: '#e0f2fe', border: '#7dd3fc', title: 'Trending news in your niche, filtered to signal', body: 'Trends pulls stories from Hacker News and NewsAPI, filters them against your knowledge graph topics, removes noise (hardware, job posts, product reviews), and surfaces up to 10 high-quality stories every 4 hours. One click turns any story into a post brief.' },
  { icon: Zap,           color: '#d97706', bg: '#fffbeb', border: '#fde68a', title: 'Daily briefing in seconds, expand to a full week', body: 'Each morning your knowledge graph loads and you get 3–5 ranked ideas with rationale, hook type, audience fit, and competitor gap. Hit Expand to plan the entire week in one go.' },
  { icon: BookOpen,      color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe', title: 'Prompt Vault — drafts in your exact voice', body: 'Save your voice, tone, format rules, and hashtags as reusable templates per platform. Accept an idea, pick a template, get a ready-to-post draft that actually sounds like you — not generic AI.' },
  { icon: BarChart2,     color: '#059669', bg: '#ecfdf5', border: '#6ee7b7', title: 'Hook performance analytics', body: 'CreatorGraph tracks which hook types — question, statistic, story, contrarian, list, bold claim — drive the most engagement for your posts. Briefings are ranked accordingly, so your best-performing patterns stay front and centre.' },
  { icon: Users,         color: '#c2410c', bg: '#fff7ed', border: '#fed7aa', title: 'Audience segments with open questions', body: 'Know exactly who reads your content: their role, their pain points, what they keep asking (\"What they\'re asking\"), and what topics you\'re planning to cover for them (\"What\'s on your mind\").' },
  { icon: Layers,        color: '#475569', bg: '#f1f5f9', border: '#cbd5e1', title: 'Multi-platform import — one unified graph', body: 'Import from LinkedIn, YouTube, Medium, Substack, GitHub, Instagram, or any local file. All sources feed one knowledge graph, so topics from your newsletters and your videos are weighed together.' },
]

const faq = [
  { q: 'Is my content data safe?', a: 'Your data is stored in an isolated database instance. We don\'t train on your data or share it with other users. Your import file is processed once and discarded — only the extracted structured graph is stored.' },
  { q: 'Do I need a LinkedIn Premium account?', a: 'No. The data export works with any LinkedIn account — free or premium. It\'s a standard privacy feature under Settings → Data Privacy.' },
  { q: 'What AI model powers this?', a: 'Llama 3.3 70B Versatile via Groq. It powers knowledge graph extraction, daily briefings, draft generation, the Trends briefing, and the chat assistant. The model is configurable without a redeploy.' },
  { q: 'How long does setup take?', a: 'About 5 minutes. Upload your LinkedIn export, wait ~60 seconds for your knowledge graph to be built, then generate your first briefing.' },
  { q: 'Does it work for niches outside tech?', a: 'Yes. The knowledge graph is niche-agnostic — it learns from what you\'ve actually written. Tech, marketing, finance, healthcare, design, coaching. The more content you have, the better it gets.' },
  { q: 'This is a new product. What if it doesn\'t work out?', a: 'Fair question. The free plan requires no card. Pro subscribers can cancel any month. If we ever shut down, we\'ll give at least 30 days notice and provide a full data export.' },
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
          <Link href="/about"   style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, fontWeight: 500, padding: '6px 12px', textDecoration: 'none' }}>About</Link>
          <Link href="/faq"     style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, fontWeight: 500, padding: '6px 12px', textDecoration: 'none' }}>FAQ</Link>
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

      {/* ── ANNOUNCEMENT BAR ──────────────────────────────────── */}
      {eb.displayActive && (
        <div style={{ background: 'linear-gradient(90deg, #c2410c 0%, #ea580c 50%, #c2410c 100%)', padding: '9px 24px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15 }}>🎉</span>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>
              Launch Offer — 50% off for the first {eb.total} customers
            </span>
            <span style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>
              {eb.remaining} spots remaining
            </span>
            <a href="#pricing" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 999, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.3)' }}>
              Claim now →
            </a>
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

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
            <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 30px', background: '#4f46e5', color: '#fff', borderRadius: 10, fontSize: 15, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 30px rgba(99,102,241,0.45)', letterSpacing: '-0.2px' }}>
              Get started free <ArrowRight size={16} />
            </Link>
            <a href="#how" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '15px 24px', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(165,180,252,0.2)', borderRadius: 10, fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
              See how it works
            </a>
          </div>

          {/* Launch Offer Hero Block */}
          {eb.displayActive && (
            <a href="#pricing" style={{ textDecoration: 'none', display: 'block', maxWidth: 480, margin: '0 auto 36px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(234,88,12,0.15) 0%, rgba(249,115,22,0.1) 100%)',
                border: '1px solid rgba(249,115,22,0.4)',
                borderRadius: 16, padding: '16px 22px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>🎉</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ color: '#fb923c', fontWeight: 900, fontSize: 15 }}>Launch Offer</span>
                    <span style={{ background: 'rgba(251,146,60,0.2)', color: '#fb923c', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                      {eb.remaining} of {eb.total} spots left
                    </span>
                  </div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    First {eb.total} customers get <span style={{ color: '#fb923c' }}>50% off</span> their first month
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 999, height: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${pctTaken}%`, height: '100%', background: 'linear-gradient(90deg, #f97316, #fb923c)', borderRadius: 999, minWidth: 6, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ color: 'rgba(251,146,60,0.7)', fontSize: 11, marginTop: 5 }}>
                    {spotsTaken} spots claimed · Applied automatically at checkout
                  </div>
                </div>
                <ArrowRight size={16} color="#fb923c" style={{ flexShrink: 0 }} />
              </div>
            </a>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '8px 28px' }}>
            {['Free tier available', 'No credit card required', '5-min setup', 'Cancel any time'].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(165,180,252,0.55)' }}>
                <CheckCircle size={12} color="#34d399" />
                {p}
              </div>
            ))}
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
            Every tool a serious creator needs, in one place
          </h2>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 48, maxWidth: 560, lineHeight: 1.7 }}>
            These features are live today — not a roadmap. Everything you see below works when you sign up.
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

          <p style={{ fontSize: 16, color: '#4b5563', marginBottom: eb.displayActive ? 24 : 48, maxWidth: 460, lineHeight: 1.7 }}>
            Start free. Upgrade only if it&apos;s worth it.
          </p>

          {eb.displayActive && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '1.5px solid #fb923c', borderRadius: 12, padding: '12px 20px', marginBottom: 36 }}>
              <span style={{ fontSize: 22 }}>🎉</span>
              <div>
                <div style={{ fontWeight: 900, color: '#c2410c', fontSize: 15 }}>Launch Offer: 50% off your first month</div>
                <div style={{ fontSize: 12, color: '#9a3412', marginTop: 2 }}>First {eb.total} customers only · {eb.remaining} spots remaining · Applied automatically</div>
              </div>
            </div>
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
                  'Multi-platform content import',
                  'Full knowledge graph — topics, hooks, audience segments',
                  'Daily briefing — 3–5 ideas per day',
                  'Repetition guard',
                  'Prompt Vault — voice templates per platform',
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

            {/* Creator — with launch offer */}
            <div style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 100%)', border: eb.displayActive ? '2px solid #f97316' : '1px solid rgba(165,180,252,0.15)', borderRadius: 18, padding: '36px 30px', position: 'relative' }}>

              {eb.displayActive && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #ea580c, #f97316)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 18px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 2px 12px rgba(249,115,22,0.4)' }}>
                  🎉 50% off — Launch Offer
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 700, color: '#a5b4fc', marginBottom: 8, marginTop: eb.displayActive ? 8 : 0 }}>Creator</div>

              {eb.displayActive ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>$14.50</span>
                    <span style={{ fontSize: 14, color: 'rgba(165,180,252,0.6)' }}>first month</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <span style={{ fontSize: 15, color: 'rgba(165,180,252,0.4)', textDecoration: 'line-through' }}>$29/mo</span>
                    <span style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.25)', padding: '2px 8px', borderRadius: 999 }}>then $29/mo</span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: '-2px' }}>$29</span>
                  <span style={{ fontSize: 15, color: 'rgba(165,180,252,0.55)' }}>/month</span>
                </div>
              )}

              <p style={{ fontSize: 13, color: 'rgba(165,180,252,0.6)', marginBottom: 28, lineHeight: 1.65 }}>150 AI generations/month. Bring your own key for unlimited usage. For creators using this daily.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                {['Everything in Free', '150 AI generations / month', 'Trends — niche news feed + 15-day history', 'Expand briefing — plan a full week', 'Hook performance analytics', 'Audience segment deep-dive', 'Priority support'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link
                href="/pricing"
                style={{
                  display: 'block', textAlign: 'center', padding: '14px',
                  background: eb.displayActive ? 'linear-gradient(135deg, #ea580c, #f97316)' : '#4f46e5',
                  color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 800,
                  textDecoration: 'none',
                  boxShadow: eb.displayActive ? '0 4px 20px rgba(249,115,22,0.45)' : '0 0 20px rgba(99,102,241,0.4)',
                  letterSpacing: '-0.2px',
                }}
              >
                {eb.displayActive ? `🎉 Claim 50% off — ${eb.remaining} spots left` : 'Get Creator'}
              </Link>
              <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(165,180,252,0.35)', marginTop: 10 }}>
                {eb.displayActive ? 'Discount applied automatically at checkout' : 'Cancel any time'}
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
          <p style={{ fontSize: 14, color: 'rgba(165,180,252,0.45)', marginBottom: 32 }}>
            Free tier available. No credit card. Built in public.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '17px 36px', background: '#4f46e5', color: '#fff', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.45)', letterSpacing: '-0.2px' }}>
              Get started free <ArrowRight size={18} />
            </Link>
            {eb.displayActive && (
              <Link href="/pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '17px 36px', background: 'linear-gradient(135deg, #ea580c, #f97316)', color: '#fff', borderRadius: 12, fontSize: 16, fontWeight: 800, textDecoration: 'none', boxShadow: '0 0 30px rgba(249,115,22,0.5)', letterSpacing: '-0.2px' }}>
                🎉 Claim 50% off <ArrowRight size={18} />
              </Link>
            )}
          </div>

          {eb.displayActive && (
            <p style={{ fontSize: 12, color: 'rgba(251,146,60,0.6)', marginTop: 14 }}>
              Launch offer · {eb.remaining} of {eb.total} spots remaining · applied at checkout
            </p>
          )}
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
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <Link href="/about"   style={{ fontSize: 12, color: 'rgba(165,180,252,0.35)', textDecoration: 'none' }}>About</Link>
            <Link href="/faq"     style={{ fontSize: 12, color: 'rgba(165,180,252,0.35)', textDecoration: 'none' }}>FAQ</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(165,180,252,0.35)', textDecoration: 'none' }}>Privacy</Link>
            <span style={{ fontSize: 12, color: 'rgba(165,180,252,0.15)' }}>Built with Next.js · Drizzle · Supabase · Groq</span>
          </div>
        </div>
      </footer>

    </div>
  )
}
