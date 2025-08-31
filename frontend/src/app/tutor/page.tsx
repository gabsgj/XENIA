'use client'
import { useState, useRef, useEffect } from 'react'
import { API_BASE } from '@/lib/api'
import { useErrorContext } from '@/lib/error-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/navigation'
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
  const [messages, setMessages] = useState<any[]>([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI tutor. I'm here to help you understand difficult concepts, solve problems, and answer any questions you have. You can ask me anything or upload an image of a problem you're working on.",
      timestamp: new Date()
    }
  ])
  const [loading, setLoading] = useState(false)
  const { pushError } = useErrorContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function ask(){
    if (!question.trim() && !file) return

    const userMessage = {
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
      let response
      if (file){
        const form = new FormData()
        form.append('file', file)
        form.append('user_id','demo-user')
        const r = await fetch(`${API_BASE}/api/tutor/ask`, { method:'POST', body: form })
        const j = await r.json().catch(()=> null)
        if(!r.ok){ 
          pushError({ errorCode: 'TUTOR_API_DOWN', errorMessage: j?.error || 'Tutor failed', details: j })
          return 
        }
        response = j
      } else {
        const r = await fetch(`${API_BASE}/api/tutor/ask`, { 
          method:'POST', 
          headers:{'Content-Type':'application/json'}, 
          body: JSON.stringify({ question, user_id:'demo-user' }) 
        })
        const j = await r.json().catch(()=> null)
        if(!r.ok){ 
          pushError({ errorCode:'TUTOR_TIMEOUT', errorMessage: j?.error || 'Tutor timed out', details:j})
          return 
        }
        response = j
      }

      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.answer || JSON.stringify(response),
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
                    <p className='whitespace-pre-wrap'>{message.content}</p>
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
