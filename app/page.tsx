import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Brain, Zap, Shield, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Memory, not RAG',
    body: 'Your past content is pre-compiled into structured knowledge — the Karpathy LLM Wiki pattern. No vector search, no re-reading raw posts every time.',
  },
  {
    icon: Zap,
    title: 'Evidence-backed ideas',
    body: 'Every content idea comes with a rationale tied to your actual history: what performed, what questions your audience asked, what competitors missed.',
  },
  {
    icon: Shield,
    title: 'Repetition guard',
    body: 'Before suggesting an idea, the system checks your archive. New angle, sequel, or repeat — you\'ll know before you write a word.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-primary" />
          <span className="font-semibold text-slate-900">CreatorGraph Lite</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-primary/8 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Zap size={12} />
          Context Engineering for content creators
        </div>
        <h1 className="text-4xl font-bold text-slate-900 leading-tight mb-5">
          Your LinkedIn content history,<br />turned into structured memory
        </h1>
        <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl mx-auto">
          Import your LinkedIn export. CreatorGraph builds a knowledge graph from your posts,
          then generates daily content ideas that actually fit your voice and audience — not generic trends.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/sign-up">
              Start for free <ArrowRight size={16} />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="p-6 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Icon size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">How it works</h2>
          <div className="space-y-8">
            {[
              { n: '01', title: 'Import your history', body: 'Download your LinkedIn data export (Settings → Data Privacy → Get a copy). Upload the CSV here in seconds.' },
              { n: '02', title: 'Memory is built', body: 'Claude reads every post and extracts structured knowledge: your expertise, your audience\'s questions, your voice patterns, what performed.' },
              { n: '03', title: 'Generate your daily briefing', body: 'Each day, load your memory into context and get 3-5 content ideas ranked by validation score — grounded in your actual history.' },
            ].map(({ n, title, body }) => (
              <div key={n} className="flex gap-6">
                <div className="text-3xl font-bold text-primary/20 shrink-0 w-12">{n}</div>
                <div className="pt-1">
                  <p className="font-semibold text-slate-900 mb-1">{title}</p>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Start building your content memory</h2>
        <p className="text-slate-500 mb-6">Free to use. No credit card required.</p>
        <Button asChild size="lg" className="gap-2">
          <Link href="/sign-up">
            Get started <ArrowRight size={16} />
          </Link>
        </Button>
      </section>

      <footer className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        CreatorGraph Lite — built with Next.js, Clerk, Supabase, and Anthropic Claude
      </footer>
    </div>
  )
}
