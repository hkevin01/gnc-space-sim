/**
 * Separator Component
 */

import React from 'react'

export interface SeparatorProps {
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export const Separator: React.FC<SeparatorProps> = ({
  className = '',
  orientation = 'horizontal'
}) => {
  const baseClasses = 'bg-gray-200'
  const orientationClasses = orientation === 'horizontal'
    ? 'h-px w-full'
    : 'w-px h-full'

  return <div className={`${baseClasses} ${orientationClasses} ${className}`} />
}
