"use client"

import React, { useEffect, useRef } from 'react'

export const Dialog = ({ children, open, onOpenChange }: any) => {
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onOpenChange && onOpenChange(false)
  }

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', onKey)
      // prevent background scroll
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
    }
    return () => {}
  }, [open])

  return (
    <div aria-hidden={!open}>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange && onOpenChange(false)} />
          <div className="relative z-10 max-h-[90vh] w-full sm:max-w-2xl overflow-auto">
            {children}
          </div>
        </div>
      )}
      {!open && children}
    </div>
  )
}

export const DialogTrigger = ({ children, ...props }: any) => (
  <button {...props}>
    {children}
  </button>
)

export const DialogContent = ({ children, className = '', ...props }: any) => {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = ref.current?.querySelector('input,button,textarea,select') as HTMLElement | null
    if (el) el.focus()
  }, [])
  return (
    <div ref={ref} className={`bg-card rounded-lg shadow-lg p-6 mx-4 ${className}`} role="dialog" aria-modal="true" {...props}>
      {children}
    </div>
  )
}

export const DialogHeader = ({ children }: any) => (
  <div className="p-2">{children}</div>
)

export const DialogTitle = ({ children, id }: any) => (
  <h3 id={id} className="text-lg font-semibold">{children}</h3>
)

export const DialogDescription = ({ children }: any) => (
  <p className="text-sm text-muted-foreground">{children}</p>
)

export const DialogFooter = ({ children }: any) => (
  <div className="pt-4 border-t">{children}</div>
)

export const DialogClose = ({ children, className, onClick, asChild, ...props }: any) => {
  // Support asChild pattern: forward click handler onto the child element
  if (asChild && React.isValidElement(children)) {
    const child = React.Children.only(children) as React.ReactElement
    const existingOnClick = (child.props as any).onClick
    const newProps: any = {
      onClick: (e: any) => {
        if (onClick) onClick(e)
        if (existingOnClick) existingOnClick(e)
      },
      'aria-label': props['aria-label'] || (child.props as any)['aria-label']
    }
    return React.cloneElement(child, newProps as any)
  }

  return <button onClick={onClick} {...props} className={className} aria-label="Close dialog">{children}</button>
}

export default Dialog
