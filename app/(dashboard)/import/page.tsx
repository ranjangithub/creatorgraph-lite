import { Header } from '@/components/layout/header'
import { ContentImporter } from '@/components/import/content-importer'
import { Download, Sparkles, Globe } from 'lucide-react'

const steps = [
  { icon: Globe,     color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', n: '01', title: 'Choose a source', body: 'LinkedIn export, Medium profile, Substack, GitHub, or any local file. Pick the platform where your content lives.' },
  { icon: Download,  color: '#4f46e5', bg: '#ede9fe', border: '#c4b5fd', n: '02', title: 'Upload or paste a URL', body: 'For LinkedIn: upload your data export ZIP or CSV. For Medium, Substack, and GitHub: paste your profile URL. For local files: drop any MD, TXT, or PDF.' },
  { icon: Sparkles,  color: '#7c3aed', bg: '#f3e8ff', border: '#d8b4fe', n: '03', title: 'Memory is built automatically', body: 'CreatorGraph reads every post, extracts topics, voice patterns, and audience signals, then builds your knowledge graph. No manual tagging needed.' },
]

export default function ImportPage() {
  return (
    <>
      <Header title="Import content" description="Build your knowledge graph from any platform you post on" />

      <div style={{ flex: 1, padding: '28px', maxWidth: 720 }}>

        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#6366f1', marginBottom: 20 }}>Import content</div>

        {/* Steps */}
        <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>How it works</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Three steps to build your content memory</div>
          </div>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map(({ icon: Icon, color, bg, border, n, title, body }, i) => (
              <div key={n} style={{ display: 'flex', gap: 16, paddingBottom: i < steps.length - 1 ? 20 : 0, position: 'relative' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', left: 19, top: 40, bottom: 0, width: 2, background: 'linear-gradient(180deg, #c4b5fd 0%, transparent 100%)' }} />
                )}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  <Icon size={17} color={color} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0f0c29' }}>{title}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Importer */}
        <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid #f0f4ff', background: '#fafbff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f0c29' }}>Upload your content</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>LinkedIn, Medium, Substack, GitHub, or any local file</div>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <ContentImporter />
          </div>
        </div>

      </div>
    </>
  )
}
