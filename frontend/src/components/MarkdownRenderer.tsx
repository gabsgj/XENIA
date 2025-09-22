import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none dark:prose-invert ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for different elements
          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-muted rounded text-sm font-mono text-foreground">
                  {children}
                </code>
              )
            }
            // Block code
            const language = className?.replace('language-', '') || ''
            return (
              <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-3">
                <code className={`text-sm font-mono ${className || ''}`}>
                  {children}
                </code>
              </pre>
            )
          },
          pre: ({ children }) => <div className="mb-3">{children}</div>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground mb-2">
              {children}
            </blockquote>
          ),
          // Math expressions are handled by KaTeX automatically
          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 py-2">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
