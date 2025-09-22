'use client'
import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/navigation'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'
import { 
  Send, 
  Paperclip, 
  Bot, 
  User, 
  Loader2,
  X
} from 'lucide-react'

export default function TutorPage(){
  const [question, setQuestion] = useState('')
  const [file, setFile] = useState<File | null>(null)
  interface TutorMessage {
    id: number
    type: 'user' | 'ai'
    content: string
    steps?: { 
      title: string; 
      detail: string;
      calculation?: string;
      code_snippet?: string;
    }[]
    file?: File | null
    timestamp: Date
  }

  const [messages, setMessages] = useState<TutorMessage[]>([
    {
      id: 1,
      type: 'ai',
      content: "**Hello! I'm your AI tutor.** 👋\n\nI'm here to help you understand *difficult concepts*, solve problems, and answer any questions you have. \n\n**What I can do:**\n- Solve **mathematical equations** with step-by-step solutions\n- Explain **scientific concepts** with real-world examples\n- Help with **programming problems** and code solutions\n- Answer **general questions** with detailed explanations\n\nYou can ask me anything or upload an image of a problem you're working on!",
      timestamp: new Date()
    }
  ])
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const { pushError } = useErrorContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load authenticated user id if available (Supabase); fallback handled by backend normalization
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const { getSupabaseClient } = await import('@/lib/supabaseClient')
        const supabase = await getSupabaseClient()
        const { data } = await supabase.auth.getSession()
        if (!active) return
        if (data.session?.user?.id) setUserId(data.session.user.id)
      } catch {/* ignore */}
    })()
    return () => { active = false }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Fetch history after we have a user id
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tutor/history`, {
          headers: { 'X-User-Id': userId }
        })
        const j = await r.json().catch(()=> null)
        if (!cancelled && j?.history && Array.isArray(j.history) && j.history.length){
          const hist: TutorMessage[] = j.history.map((h: any) => ({
            id: Date.parse(h.created_at) || Math.random(),
            type: h.role === 'user' ? 'user' : 'ai',
            content: h.content,
            steps: h.steps ? h.steps.map((step: any) => ({
              title: step.title || '',
              detail: step.detail || '',
              calculation: step.calculation,
              code_snippet: step.code_snippet
            })) : undefined,
            timestamp: new Date(h.created_at)
          }))
          setMessages(prev => {
            // keep initial greeting then add history (avoid duplicates if already loaded)
            const base = prev.length && prev[0].id === 1 ? [prev[0]] : []
            return [...base, ...hist]
          })
        }
      } catch {/* ignore */}
    })()
  return () => { cancelled = true }
  }, [userId])

  async function ask(){
    if (!question.trim() && !file) return

    const userMessage: TutorMessage = {
      id: Date.now(),
      type: 'user',
      content: question,
      file: file,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      let response: any
      if (file){
        const form = new FormData()
        form.append('file', file)
        // only send user_id if we truly have one; backend will normalize implicitly
        if (userId) form.append('user_id', userId)
        const r = await fetch(`${API_BASE}/api/tutor/ask`, { 
          method:'POST', 
          body: form,
          headers: userId ? { 'X-User-Id': userId } : undefined
        })
        const j = await r.json().catch(()=> null)
        if(!r.ok){ 
          pushError({ errorCode: 'TUTOR_API_DOWN', errorMessage: j?.error || 'Tutor failed', details: j })
          return 
        }
        response = j
      } else {
        const r = await fetch(`${API_BASE}/api/tutor/ask`, { 
          method:'POST', 
          headers:{
            'Content-Type':'application/json',
            ...(userId ? { 'X-User-Id': userId } : {})
          }, 
          body: JSON.stringify({ question, ...(userId ? { user_id: userId } : {}) }) 
        })
        const j = await r.json().catch(()=> null)
        if(!r.ok){ 
          pushError({ errorCode:'TUTOR_TIMEOUT', errorMessage: j?.error || 'Tutor timed out', details:j})
          return 
        }
        response = j
      }

      const aiMessage: TutorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer || 'Here are your steps:',
        steps: Array.isArray(response.steps) ? response.steps.map((step: any) => ({
          title: step.title || '',
          detail: step.detail || '',
          calculation: step.calculation,
          code_snippet: step.code_snippet
        })) : undefined,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      pushError({ 
        errorCode: 'TUTOR_ERROR', 
        errorMessage: 'Failed to get response from AI tutor', 
        details: error 
      })
    } finally {
      setLoading(false)
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      ask()
    }
  }

  return (
    <MainLayout>
      <div className='h-screen flex flex-col'>
        {/* Header */}
        <div className='border-b border-border p-6'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center'>
              <Bot className='w-5 h-5 text-primary' />
            </div>
            <div>
              <h1 className='text-2xl font-bold'>AI Tutor</h1>
              <p className='text-muted-foreground'>Get instant help with your studies</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className='flex-1 overflow-y-auto p-6 space-y-6'>
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type === 'ai' && (
                <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0'>
                  <Bot className='w-4 h-4 text-primary' />
                </div>
              )}
              
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                <Card className={`${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted/50'}`}>
                  <CardContent className='p-4'>
                    {message.file && (
                      <div className='mb-3 p-2 bg-muted rounded border flex items-center gap-2'>
                        <Paperclip className='w-4 h-4' />
                        <span className='text-sm'>{message.file.name}</span>
                      </div>
                    )}
                    <MarkdownRenderer content={message.content} />
                    {message.steps && message.steps.length > 0 && (
                      <div className='mt-3 space-y-3'>
                        {message.steps.map((s, i) => (
                          <div key={i} className='p-3 rounded border bg-background/50'>
                            <div className='font-semibold text-sm mb-2'>
                              <MarkdownRenderer content={`${i+1}. ${s.title}`} />
                            </div>
                            <div className='text-sm leading-relaxed'>
                              <MarkdownRenderer content={s.detail} />
                            </div>
                            {s.calculation && (
                              <div className='mt-2 text-sm'>
                                <div className='font-medium text-muted-foreground mb-1'>Calculation:</div>
                                <MarkdownRenderer content={s.calculation} />
                              </div>
                            )}
                            {s.code_snippet && (
                              <div className='mt-2 text-sm'>
                                <div className='font-medium text-muted-foreground mb-1'>Code:</div>
                                <MarkdownRenderer content={s.code_snippet} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <p className={`text-xs text-muted-foreground mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>

              {message.type === 'user' && (
                <div className='w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 order-2'>
                  <User className='w-4 h-4' />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className='flex gap-3 justify-start'>
              <div className='w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center'>
                <Bot className='w-4 h-4 text-primary' />
              </div>
              <Card className='bg-muted/50'>
                <CardContent className='p-4'>
                  <div className='flex items-center gap-2'>
                    <Loader2 className='w-4 h-4 animate-spin' />
                    <span>AI is thinking...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className='border-t border-border p-6'>
          {file && (
            <div className='mb-4 p-3 bg-muted rounded-lg flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Paperclip className='w-4 h-4' />
                <span className='text-sm'>{file.name}</span>
                <Badge variant="outline">Image</Badge>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => {
                  setFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                <X className='w-4 h-4' />
              </Button>
            </div>
          )}
          
          <div className='flex gap-3'>
            <div className='flex-1 relative'>
              <Textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className='min-h-[60px] pr-12 resize-none'
                disabled={loading}
              />
              <div className='absolute bottom-3 right-3 flex gap-1'>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Paperclip className='w-4 h-4' />
                </Button>
              </div>
            </div>
            <Button onClick={ask} disabled={loading || (!question.trim() && !file)} size="lg">
              <Send className='w-4 h-4' />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type='file'
            accept='.png,.jpg,.jpeg,.pdf'
            onChange={e => setFile(e.target.files?.[0] || null)}
            className='hidden'
          />

          <div className='mt-3 flex flex-wrap gap-2'>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setQuestion("Explain this concept to me")}
              disabled={loading}
            >
              Explain concept
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setQuestion("Help me solve this problem")}
              disabled={loading}
            >
              Solve problem
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setQuestion("Give me practice questions")}
              disabled={loading}
            >
              Practice questions
            </Button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
