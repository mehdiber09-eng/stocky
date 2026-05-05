import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import API from '../api/api'
import { useLanguage } from '../context/LanguageContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function Chatbot() {
  const { t, lang } = useLanguage()

  const SUGGESTIONS = [
    t('chat_suggest1'),
    t('chat_suggest2'),
    t('chat_suggest3'),
    t('chat_suggest4'),
  ]

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('chat_welcome') }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text?: string) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const arabicPrefix: Message[] = lang === 'ar' ? [
        { role: 'user', content: 'من الآن فصاعداً، أجب دائماً باللغة العربية فقط. أنت مستشار ذكي متخصص في إدارة المخزون وسلاسل التوريد.' },
        { role: 'assistant', content: 'حسناً، سأجيب دائماً باللغة العربية. أنا مستشارك الذكي لإدارة المخزون وتحليل بيانات المبيعات.' },
      ] : []
      const res = await API.post('/chat/', {
        messages: [...arabicPrefix, ...newMessages.map(m => ({ role: m.role, content: m.content }))]
      })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.content }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.detail || t('chat_error')
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
          <Sparkles size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-100">{t('chat_title')}</h1>
          <p className="text-sm text-zinc-500">{t('chat_subtitle')}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              m.role === 'assistant' ? 'bg-brand-500/10 text-brand-400' : 'bg-surface-tertiary text-zinc-400'
            }`}>
              {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div className={`max-w-lg px-4 py-3 rounded-xl text-sm leading-relaxed ${
              m.role === 'assistant'
                ? 'bg-surface-secondary border border-surface-border text-zinc-200'
                : 'bg-brand-600 text-white'
            }`}>
              {m.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
              <Bot size={14} />
            </div>
            <div className="bg-surface-secondary border border-surface-border px-4 py-3 rounded-xl">
              <Loader2 size={14} className="animate-spin text-zinc-500" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-lg bg-surface-secondary border border-surface-border text-zinc-400 hover:text-zinc-100 hover:border-brand-500/50 transition-all">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <input className="input flex-1" placeholder={t('chat_placeholder')}
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          disabled={loading} />
        <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
          className="btn-primary px-4 flex items-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  )
}
