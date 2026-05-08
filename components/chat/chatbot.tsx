'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { MessageCircle, X, Send, Bot, Sparkles, ChevronDown } from 'lucide-react'

interface Message {
  id:        string
  role:      'user' | 'assistant'
  content:   string
  streaming?: boolean
}

const SALES_SUGGESTIONS = [
  'How does the knowledge graph work?',
  'What\'s the early bird offer?',
  'How is this different from ChatGPT?',
  'How long does setup take?',
]

const SUPPORT_SUGGESTIONS = [
  'How do I get better briefing ideas?',
  'What does BYOK mean?',
  'How do I upgrade my plan?',
  'My briefing isn\'t generating',
]

const SALES_WELCOME   = "👋 Hi! I'm CreatorGraph's AI — ask me anything about how it works, pricing, or whether it's right for you."
const SUPPORT_WELCOME = "👋 Hi! I'm here to help you get the most out of CreatorGraph. What can I help you with?"

let msgCounter = 0
function uid() { return `m${++msgCounter}` }

export function Chatbot() {
  const pathname = usePathname()
  const isDashboard = !['/', '/pricing', '/sign-in', '/sign-up'].some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )

  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [streaming, setStreaming] = useState(false)
  const [unread, setUnread]     = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: 'assistant', content: isDashboard ? SUPPORT_WELCOME : SALES_WELCOME },
  ])

  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const abortRef   = useRef<AbortController | null>(null)

  const suggestions = isDashboard ? SUPPORT_SUGGESTIONS : SALES_SUGGESTIONS

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) {
      setUnread(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || streaming) return
    setInput('')

    const userMsg: Message = { id: uid(), role: 'user', content: text.trim() }
    const asstId = uid()
    const asstMsg: Message = { id: asstId, role: 'assistant', content: '', streaming: true }

    setMessages(prev => [...prev, userMsg, asstMsg])
    setStreaming(true)

    const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ messages: history }),
        signal:  abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const { text } = JSON.parse(data) as { text: string }
            setMessages(prev => prev.map(m =>
              m.id === asstId ? { ...m, content: m.content + text } : m
            ))
          } catch { /* ignore malformed chunks */ }
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === asstId
            ? { ...m, content: 'Sorry, something went wrong. Please try again.', streaming: false }
            : m
        ))
      }
    } finally {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, streaming: false } : m))
      setStreaming(false)
      if (!open) setUnread(true)
    }
  }, [messages, streaming, open])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const hasOnlyWelcome = messages.length === 1

  return (
    <>
      {/* ── Chat panel ───────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 24, zIndex: 1000,
          width: 380, height: 540,
          background: '#fff',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(79,70,229,0.12)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #e0e7ff',
          animation: 'chatSlideUp 0.2s ease',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            padding: '16px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, lineHeight: 1.2 }}>CreatorGraph AI</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>Online · Usually replies instantly</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronDown size={16} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Suggested questions shown only on first open */}
            {hasOnlyWelcome && (
              <>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={14} color="#fff" />
                  </div>
                  <div style={{ background: '#f8f9ff', borderRadius: '4px 14px 14px 14px', padding: '10px 14px', maxWidth: '80%', fontSize: 13, color: '#1a1a2e', lineHeight: 1.55 }}>
                    {messages[0].content}
                  </div>
                </div>
                <div style={{ paddingLeft: 38, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {suggestions.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        textAlign: 'left', padding: '8px 12px', borderRadius: 10,
                        border: '1px solid #e0e7ff', background: '#fff',
                        fontSize: 12, color: '#4f46e5', fontWeight: 600,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Full message history (skip first welcome if showing suggestions) */}
            {(!hasOnlyWelcome ? messages : messages.slice(1)).map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  gap: 8, alignItems: 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <Bot size={14} color="#fff" />
                  </div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#f8f9ff',
                  color:      msg.role === 'user' ? '#fff' : '#1a1a2e',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  padding: '10px 14px',
                  fontSize: 13, lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                  {msg.streaming && msg.content === '' && (
                    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center', height: 16 }}>
                      {[0, 1, 2].map(i => (
                        <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: `bounce 1.2s ${i * 0.2}s ease infinite` }} />
                      ))}
                    </span>
                  )}
                  {msg.streaming && msg.content !== '' && (
                    <span style={{ display: 'inline-block', width: 2, height: 13, background: '#4f46e5', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f4ff', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              disabled={streaming}
              style={{
                flex: 1, border: '1px solid #e0e7ff', borderRadius: 10,
                padding: '9px 14px', fontSize: 13, outline: 'none',
                background: streaming ? '#f8f9ff' : '#fff',
                color: '#1a1a2e',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#4f46e5')}
              onBlur={e  => (e.target.style.borderColor = '#e0e7ff')}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || streaming}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: input.trim() && !streaming ? 'linear-gradient(135deg, #4f46e5, #7c3aed)' : '#e0e7ff',
                cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, transition: 'background 0.15s',
              }}
            >
              <Send size={15} color={input.trim() && !streaming ? '#fff' : '#94a3b8'} />
            </button>
          </div>

          <div style={{ textAlign: 'center', padding: '6px 0 8px', fontSize: 10, color: '#c4c9d4' }}>
            Powered by Anthropic Claude
          </div>
        </div>
      )}

      {/* ── Floating bubble ───────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 1001,
          width: 56, height: 56, borderRadius: '50%', border: 'none',
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          boxShadow: '0 4px 20px rgba(79,70,229,0.45)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.boxShadow = '0 6px 28px rgba(79,70,229,0.55)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(79,70,229,0.45)'
        }}
        aria-label="Open chat"
      >
        {open
          ? <X size={22} color="#fff" />
          : <MessageCircle size={22} color="#fff" />
        }
        {!open && unread && (
          <div style={{ position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
        )}
      </button>

      {/* ── Keyframe animations ───────────────────────────────── */}
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%           { transform: translateY(-4px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </>
  )
}
