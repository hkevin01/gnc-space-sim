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
    default: 'bg-gray-700 text-gray-200',
    secondary: 'bg-gray-600 text-gray-300',
    success: 'bg-green-800 text-green-100',
    warning: 'bg-yellow-800 text-yellow-100',
    error: 'bg-red-800 text-red-100'
  }

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}
