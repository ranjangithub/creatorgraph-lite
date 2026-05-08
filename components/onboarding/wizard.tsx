'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Sparkles, CheckCircle, Linkedin, User, BookOpen, Users } from 'lucide-react'

const TOPIC_OPTIONS = [
  'Platform Engineering', 'DevOps & Infrastructure', 'Engineering Management',
  'Software Architecture', 'AI / Machine Learning', 'Product Management',
  'Leadership & Culture', 'Career Growth', 'Startup Lessons', 'Cloud & Kubernetes',
  'Developer Experience', 'Data Engineering', 'Security', 'Blockchain / Web3',
]

const AUDIENCE_OPTIONS = [
  'CTOs & VPs of Engineering', 'Engineering Managers', 'Staff & Principal Engineers',
  'Founders & Co-founders', 'Product Managers', 'Junior Developers',
  'Aspiring Tech Leads', 'Enterprise Architects', 'DevOps Engineers', 'Data Scientists',
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', sub: '7+ posts/week' },
  { value: 'few_week', label: 'Few times/week', sub: '3–6 posts/week' },
  { value: 'weekly', label: 'Weekly', sub: '1–2 posts/week' },
  { value: 'sporadic', label: 'Sporadic', sub: 'When inspired' },
]

interface FormData {
  name: string
  linkedinUrl: string
  frequency: string
  topics: string[]
  audiences: string[]
}

const TOTAL_STEPS = 4

const stepMeta = [
  { icon: User,     label: 'About you',     title: "Let's start with you",           sub: "Tell us your name so CreatorGraph can personalise your experience." },
  { icon: Linkedin, label: 'LinkedIn',       title: 'Your LinkedIn presence',          sub: 'We\'ll pull context from your profile to personalise recommendations.' },
  { icon: BookOpen, label: 'Your content',   title: 'What do you write about?',       sub: 'Select every topic that appears in your content. Pick as many as apply.' },
  { icon: Users,    label: 'Your audience',  title: 'Who reads your content?',        sub: 'Knowing your audience helps CreatorGraph suggest ideas they actually care about.' },
]

function ProgressBar({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? '#4f46e5' : i === step ? '#a5b4fc' : '#e0e7ff', transition: 'all 0.3s' }} />
      ))}
    </div>
  )
}

function ChipSelect({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt)
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: active ? '#4f46e5' : '#fafbff',
              color: active ? '#fff' : '#4b5563',
              border: `1.5px solid ${active ? '#4f46e5' : '#e0e7ff'}`,
              transition: 'all 0.15s',
            }}
          >
            {active && <span style={{ marginRight: 5 }}>✓</span>}{opt}
          </button>
        )
      })}
    </div>
  )
}

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep]   = useState(0)
  const [done, setDone]   = useState(false)
  const [form, setForm]   = useState<FormData>({ name: '', linkedinUrl: '', frequency: '', topics: [], audiences: [] })

  function toggleTopic(t: string)    { setForm(f => ({ ...f, topics:    f.topics.includes(t)    ? f.topics.filter(x => x !== t)    : [...f.topics, t] })) }
  function toggleAudience(a: string) { setForm(f => ({ ...f, audiences: f.audiences.includes(a) ? f.audiences.filter(x => x !== a) : [...f.audiences, a] })) }

  function canNext() {
    if (step === 0) return form.name.trim().length >= 2
    if (step === 1) return true // LinkedIn URL optional
    if (step === 2) return form.topics.length >= 1
    if (step === 3) return form.audiences.length >= 1
    return true
  }

  async function finish() {
    localStorage.setItem('cg_onboarding', JSON.stringify(form))
    setDone(true)
    setTimeout(() => router.push('/'), 1800)
  }

  function next() {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1)
    else finish()
  }

  const meta = stepMeta[step]

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid rgba(165,180,252,0.4)' }}>
            <CheckCircle size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10, letterSpacing: '-0.5px' }}>You're all set, {form.name.split(' ')[0]}!</h2>
          <p style={{ fontSize: 15, color: 'rgba(165,180,252,0.7)' }}>Loading your dashboard…</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 100%)', padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(165,180,252,0.3)' }}>
          <Sparkles size={14} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, color: '#fff', fontSize: 14 }}>CreatorGraph</span>
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(79,70,229,0.3)', color: '#c7d2fe', border: '1px solid rgba(165,180,252,0.25)', letterSpacing: 1 }}>BETA</span>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(165,180,252,0.5)', fontWeight: 500 }}>Step {step + 1} of {TOTAL_STEPS}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 60px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          <ProgressBar step={step + 1} />

          {/* Step label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {stepMeta.map((s, i) => {
              const Icon = s.icon
              const active = i === step
              const done = i < step
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: active ? 1 : done ? 0.5 : 0.25 }}>
                  {i > 0 && <div style={{ width: 20, height: 1, background: '#c4b5fd', flexShrink: 0 }} />}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Icon size={13} color={active ? '#4f46e5' : '#94a3b8'} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#4f46e5' : '#94a3b8', display: step > 1 ? 'none' : 'inline' }}>{s.label}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Card */}
          <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 18, padding: '36px 36px', boxShadow: '0 4px 24px rgba(79,70,229,0.06)' }}>

            {/* Icon */}
            <div style={{ width: 52, height: 52, borderRadius: 14, background: '#ede9fe', border: '1px solid #c4b5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <meta.icon size={24} color="#4f46e5" />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f0c29', marginBottom: 8, letterSpacing: '-0.4px' }}>{meta.title}</h2>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, marginBottom: 28 }}>{meta.sub}</p>

            {/* Step 0: Name */}
            {step === 0 && (
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Full name</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && canNext() && next()}
                  placeholder="e.g. Rajesh Ranjan"
                  style={{ width: '100%', padding: '13px 16px', fontSize: 16, fontWeight: 600, border: '1.5px solid #e0e7ff', borderRadius: 10, outline: 'none', color: '#0f0c29', background: '#fafbff', boxSizing: 'border-box' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#e0e7ff' }}
                />
              </div>
            )}

            {/* Step 1: LinkedIn */}
            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>LinkedIn profile URL</label>
                  <input
                    autoFocus
                    value={form.linkedinUrl}
                    onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourname"
                    style={{ width: '100%', padding: '13px 16px', fontSize: 14, border: '1.5px solid #e0e7ff', borderRadius: 10, outline: 'none', color: '#0f0c29', background: '#fafbff', boxSizing: 'border-box' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#6366f1' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#e0e7ff' }}
                  />
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>Optional — used to personalise your profile context</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>How often do you post?</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {FREQUENCY_OPTIONS.map(opt => {
                      const active = form.frequency === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => setForm(f => ({ ...f, frequency: opt.value }))}
                          style={{ padding: '12px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer', background: active ? '#ede9fe' : '#fafbff', border: `1.5px solid ${active ? '#7c3aed' : '#e0e7ff'}`, transition: 'all 0.15s' }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#4f46e5' : '#0f0c29' }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{opt.sub}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Topics */}
            {step === 2 && (
              <div>
                <ChipSelect options={TOPIC_OPTIONS} selected={form.topics} onToggle={toggleTopic} />
                {form.topics.length > 0 && (
                  <p style={{ fontSize: 12, color: '#6366f1', marginTop: 14, fontWeight: 600 }}>{form.topics.length} topic{form.topics.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}

            {/* Step 3: Audience */}
            {step === 3 && (
              <div>
                <ChipSelect options={AUDIENCE_OPTIONS} selected={form.audiences} onToggle={toggleAudience} />
                {form.audiences.length > 0 && (
                  <p style={{ fontSize: 12, color: '#6366f1', marginTop: 14, fontWeight: 600 }}>{form.audiences.length} audience type{form.audiences.length !== 1 ? 's' : ''} selected</p>
                )}
              </div>
            )}

            {/* Nav buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
              <button
                onClick={() => setStep(s => s - 1)}
                disabled={step === 0}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', background: 'none', border: '1.5px solid #e0e7ff', borderRadius: 9, fontSize: 13, fontWeight: 600, color: step === 0 ? '#d1d5db' : '#6b7280', cursor: step === 0 ? 'default' : 'pointer' }}
              >
                <ArrowLeft size={14} /> Back
              </button>

              <button
                onClick={next}
                disabled={!canNext()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: canNext() ? '#4f46e5' : '#e0e7ff', color: canNext() ? '#fff' : '#94a3b8', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'all 0.15s', boxShadow: canNext() ? '0 0 20px rgba(79,70,229,0.3)' : 'none' }}
              >
                {step === TOTAL_STEPS - 1 ? 'Go to dashboard' : 'Continue'} <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* Skip link */}
          {step === 1 && (
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
              <button onClick={next} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                Skip this step →
              </button>
            </p>
          )}

        </div>
      </div>
    </div>
  )
}
