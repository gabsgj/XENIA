"use client"

import React from 'react'

export const Dialog = ({ children, open, onOpenChange }: any) => (
  <div role="dialog" aria-hidden={!open}>{children}</div>
)

export const DialogTrigger = ({ children, ...props }: any) => (
  <button {...props}>
    {children}
  </button>
)

export const DialogContent = ({ children, className }: any) => (
  <div className={className}>{children}</div>
)

export const DialogHeader = ({ children }: any) => (
  <div className="p-2">{children}</div>
)

export const DialogTitle = ({ children }: any) => (
  <h3 className="text-lg font-semibold">{children}</h3>
)

export default Dialog
