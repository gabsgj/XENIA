"use client"

import React from 'react'

export const DropdownMenu = ({ children }: any) => <div className="relative inline-block text-left">{children}</div>
export const DropdownMenuTrigger = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
)
export const DropdownMenuContent = ({ children, className }: any) => (
  <div className={className}>{children}</div>
)
export const DropdownMenuItem = ({ children, onSelect, ...props }: any) => (
  <div role="menuitem" onClick={onSelect} {...props} className="px-2 py-1 hover:bg-gray-100">{children}</div>
)
export const DropdownMenuSeparator = () => <div className="my-1 border-t" />

export default DropdownMenu
