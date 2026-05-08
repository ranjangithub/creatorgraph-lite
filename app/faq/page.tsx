import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

function Nav() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(15,12,41,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(165,180,252,0.1)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(165,180,252,0.3)' }}>
            <Sparkles size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 15 }}>CreatorGraph</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/about"   style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, padding: '6px 12px', textDecoration: 'none' }}>About</Link>
          <Link href="/faq"     style={{ color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 12px', textDecoration: 'none' }}>FAQ</Link>
          <Link href="/privacy" style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, padding: '6px 12px', textDecoration: 'none' }}>Privacy</Link>
          <Link href="/sign-in" style={{ color: 'rgba(165,180,252,0.7)', fontSize: 13, padding: '6px 12px', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#4f46e5', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            Try it free <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

const faqs = [
  {
    category: 'Getting started',
    items: [
      {
        q: 'What is CreatorGraph?',
        a: 'CreatorGraph is a personal content intelligence platform. It analyses your complete content archive — LinkedIn posts, articles, YouTube videos, newsletters, and more — and builds a structured knowledge graph of your topics, audience, and voice. Every day it generates a briefing with 3–5 content ideas ranked by freshness, audience fit, and hook performance, grounded in your actual history — not generic AI suggestions.',
      },
      {
        q: 'How do I get started?',
        a: 'Sign up, then import your content on the Import page. The fastest route is your LinkedIn data export: go to LinkedIn Settings → Data Privacy → Get a copy of your data, request your posts archive, and upload the zip file. CreatorGraph processes your posts in under 60 seconds and generates your first briefing.',
      },
      {
        q: 'How long does setup take?',
        a: 'About 5 minutes once you have your export. The LinkedIn export request takes 10 minutes to 24 hours from LinkedIn\'s side depending on archive size. Once you have the file, upload takes under a minute and graph generation is done in ~60 seconds.',
      },
      {
        q: 'Does it work for niches outside tech?',
        a: 'Yes. The knowledge graph is niche-agnostic — it works wherever you have a content history. Tech, marketing, finance, healthcare, design, coaching, legal, creative industries. The system learns from what you\'ve actually written, so the more specific your niche, the better the ideas.',
      },
      {
        q: 'What platforms can I import content from?',
        a: 'LinkedIn (ZIP export or CSV), YouTube (URL or transcript paste), Medium (article URL), Substack (post URL), GitHub (profile URL), Instagram (caption paste or CSV), and any plain text or Markdown file. New import sources are added regularly.',
      },
    ],
  },
  {
    category: 'Features & capabilities',
    items: [
      {
        q: 'What is the daily briefing?',
        a: 'The daily briefing generates 3–5 content ideas ranked by topic freshness (days since you last wrote about it), audience question backlog (open questions your readers keep asking), and hook diversity (avoiding your most overused patterns). Each idea includes a hook type, rationale, audience fit, and a competitor gap — the angle your niche peers are not taking.',
      },
      {
        q: 'What is the Expand briefing feature?',
        a: 'Expand briefing generates a full week of planned topics beyond your daily ideas. It checks what you\'ve already been suggested today and never repeats them. It\'s useful when you want to plan ahead rather than work day-by-day. You can toggle this feature from the briefing page.',
      },
      {
        q: 'What is the Trends feature?',
        a: 'Trends surfaces what\'s actually being discussed in your content world right now — not generic tech news. It pulls stories from Hacker News and NewsAPI, filters them against your knowledge graph topics, removes noise (consumer hardware, job posts, product reviews), and shows up to 10 high-quality stories refreshed every 4 hours. Each story has a "Generate briefing" button that creates 3 post ideas based on that specific story.',
      },
      {
        q: 'What is the 15-day trend history?',
        a: 'Every day\'s trending stories are saved as a snapshot. The Trends page shows a scrollable, collapsible timeline of the past 14 days so you can revisit stories you may have missed and generate ideas from older trending topics. Snapshots older than 15 days are automatically removed.',
      },
      {
        q: 'What is the Prompt Vault?',
        a: 'The Prompt Vault is a library of reusable voice and format templates, one per platform and content type. Each template stores your brand voice, tone instructions, format rules, and hashtags. When you accept a briefing idea and click "Write with AI," you pick a template — and the draft is generated in your exact voice, not generic AI prose. Four sample templates are pre-loaded for you to edit.',
      },
      {
        q: 'What does the knowledge graph show me?',
        a: 'The knowledge graph is your structured content memory: topics you cover (with authority scores), hooks you use (with confidence scores and type classification), audience segments who read you, questions your audience keeps asking, and topics you plan to cover next. Everything is deduplicated and searchable from the Memory page.',
      },
      {
        q: 'What are "What they\'re asking" and "What\'s on your mind"?',
        a: '"What they\'re asking" surfaces the top audience questions extracted from your content — the recurring questions your readers have that you haven\'t fully answered yet. "What\'s on your mind" shows your saved content intentions — topics you\'ve told CreatorGraph you want to write about. Both appear under the audience segment cards on your dashboard.',
      },
      {
        q: 'Is there an API to access my drafts programmatically?',
        a: 'Yes. GET /api/drafts returns your generated drafts with filters for platform, status, and source idea. GET /api/drafts/:id retrieves a single draft. PATCH /api/drafts/:id lets you update a draft\'s status (ready, edited, or posted). All endpoints are authenticated and owner-scoped — only you can access your own drafts.',
      },
    ],
  },
  {
    category: 'Import & content',
    items: [
      {
        q: 'How does LinkedIn import work?',
        a: 'LinkedIn offers two export types. Basic export (faster, ~10 min): Settings → Data Privacy → Get a copy of your data → select basic fields. Full export (slower, up to 24 hours): same path but select Posts & Articles. Both ZIP formats are detected and parsed automatically — no manual unzipping needed. Both the Basic HTML format and Full CSV format are supported.',
      },
      {
        q: 'Can I import from multiple platforms?',
        a: 'Yes. You can import from LinkedIn, YouTube, Medium, Substack, GitHub, Instagram, and local files all into the same knowledge graph. The AI treats all sources as one unified content history, so topics and hooks from your LinkedIn posts are weighed alongside topics from your YouTube videos.',
      },
      {
        q: 'Does importing overwrite my existing data?',
        a: 'No. Import is additive. Content items use a unique constraint per platform and content ID — re-importing a platform only adds new posts, it doesn\'t duplicate what\'s already there. Your knowledge graph is updated incrementally with each import.',
      },
      {
        q: 'How accurate is the knowledge graph extraction?',
        a: 'For creators with 50+ posts, topic extraction reaches ~85% accuracy on the first pass. The AI reads your content in batches and extracts structured nodes. You can manually edit, add, and remove topics and hooks from the Memory page to improve accuracy over time.',
      },
    ],
  },
  {
    category: 'AI & technology',
    items: [
      {
        q: 'What AI model powers CreatorGraph?',
        a: 'Knowledge graph extraction, daily briefings, draft generation, and the chat assistant all run on Llama 3.3 70B Versatile via Groq\'s infrastructure. The model, temperature, and generation parameters are configurable at the admin level without a redeploy. We choose models based on quality, speed, and cost.',
      },
      {
        q: 'What if the AI generates a bad idea?',
        a: 'Every idea includes a rationale and validation score so you can assess it quickly. You can reject ideas with one click — rejected ideas are fed back into the system to improve future briefings. The goal is that at least 1 in 3 ideas is immediately actionable, not that all of them are perfect.',
      },
      {
        q: 'How does the repetition guard work?',
        a: 'Before generating a briefing, CreatorGraph checks your full content archive and today\'s already-generated ideas. Topics you\'ve recently covered are deprioritised. Ideas that would duplicate today\'s suggestions are excluded before the AI call. You\'ll never get the same idea twice in a day, and you\'ll always know when a topic is a new angle versus a sequel.',
      },
      {
        q: 'How does the trends noise filter work?',
        a: 'Trends uses a two-pass filter. First, it hard-blocks stories matching noise patterns (consumer hardware, laptops, keyboards, job posts, product reviews). Second, it scores remaining stories by how many of your knowledge graph topics they match. Only stories with at least one topic match — or that independently qualify as content-worthy (AI/ML, startups, research, creator economy) — are shown. Maximum 10 results per refresh.',
      },
    ],
  },
  {
    category: 'Data & privacy',
    items: [
      {
        q: 'Is my content data safe?',
        a: 'Your data is stored in an isolated database instance and is never shared with other users. We do not train AI models on your content. Your export file is processed once at import time — we store only the extracted structured data, not the raw file.',
      },
      {
        q: 'Who has access to my content?',
        a: 'Only you. The CreatorGraph team does not access individual user data except in the case of a reported bug or support request — and only with your explicit permission. See our Privacy Policy for the full breakdown.',
      },
      {
        q: 'Can I delete my data?',
        a: 'Yes. You can delete your account at any time from Settings. All your content, knowledge graph, briefings, drafts, and ideas will be permanently deleted within 30 days.',
      },
      {
        q: 'Do you sell data to third parties?',
        a: 'No. We do not sell, share, or license your data to any third parties. Your content archive is used only to power your personal CreatorGraph experience. The optional niche benchmarking feature — which contributes anonymised topic aggregates to cross-creator comparisons — requires explicit opt-in.',
      },
    ],
  },
  {
    category: 'Plans & billing',
    items: [
      {
        q: 'Is there a free plan?',
        a: 'Yes. The free plan includes full knowledge graph extraction, daily briefings, and 20 AI generations per month. No credit card required. Every feature you need to evaluate whether CreatorGraph is worth upgrading is available on the free tier.',
      },
      {
        q: 'What does the Creator plan include?',
        a: 'Creator includes 150 AI generations per month, the full Prompt Vault, the Trends feature with 15-day history, audience segment analysis, hook performance analytics, and priority support. See the pricing page for current pricing.',
      },
      {
        q: 'Can I cancel at any time?',
        a: 'Yes. Plans are monthly and can be cancelled at any time from your billing settings. You keep access until the end of your current billing period.',
      },
      {
        q: 'This is a new product. What if it shuts down?',
        a: 'Fair concern. If we ever shut down, we will give at least 30 days notice, provide a full export of your knowledge graph and all generated drafts, and issue pro-rated refunds for any prepaid time. We believe in responsible product stewardship.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fff', minHeight: '100vh' }}>
      <Nav />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #1e1b4b 100%)', padding: '64px 28px 56px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: '#818cf8', marginBottom: 12 }}>FAQ</div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', letterSpacing: '-0.8px', marginBottom: 14 }}>Frequently asked questions</h1>
        <p style={{ fontSize: 16, color: 'rgba(165,180,252,0.65)', maxWidth: 480, margin: '0 auto' }}>
          Everything you need to know about CreatorGraph. Can&apos;t find your answer?{' '}
          <a href="mailto:support@creatorgraph.ai" style={{ color: '#818cf8', textDecoration: 'underline' }}>Email us</a>.
        </p>
      </div>

      {/* Jump links */}
      <div style={{ background: '#f8f9ff', borderBottom: '1px solid #e0e7ff', padding: '16px 28px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {faqs.map(s => (
            <a key={s.category} href={`#${s.category.toLowerCase().replace(/[^a-z]+/g, '-')}`}
              style={{ fontSize: 12, fontWeight: 600, color: '#6366f1', padding: '5px 12px', borderRadius: 20, border: '1px solid #e0e7ff', background: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              {s.category}
            </a>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 28px 80px' }}>
        {faqs.map(section => (
          <div key={section.category} id={section.category.toLowerCase().replace(/[^a-z]+/g, '-')} style={{ marginBottom: 52 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>
              {section.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
              {section.items.map((item, i) => (
                <div key={item.q} style={{ borderTop: i === 0 ? 'none' : '1px solid #f0f4ff' }}>
                  <div style={{ padding: '20px 24px' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f0c29', marginBottom: 10 }}>{item.q}</p>
                    <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.8, margin: 0 }}>{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ textAlign: 'center', padding: '32px 0 0' }}>
          <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 20 }}>Still have questions?</p>
          <a href="mailto:support@creatorgraph.ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', border: '1px solid #e0e7ff', color: '#4f46e5', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', background: '#fafbff' }}>
            Contact support
          </a>
        </div>
      </div>

      <footer style={{ background: '#0f0c29', borderTop: '1px solid rgba(165,180,252,0.08)', padding: '36px 28px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <span style={{ fontWeight: 800, color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>CreatorGraph</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href="/about"   style={{ fontSize: 12, color: 'rgba(165,180,252,0.4)', textDecoration: 'none' }}>About</Link>
            <Link href="/faq"     style={{ fontSize: 12, color: 'rgba(165,180,252,0.4)', textDecoration: 'none' }}>FAQ</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: 'rgba(165,180,252,0.4)', textDecoration: 'none' }}>Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
