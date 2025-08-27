/**
 * Badge Component
 */

import React from 'react'

export interface BadgeProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error'
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className = '',
  variant = 'default'
}) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
