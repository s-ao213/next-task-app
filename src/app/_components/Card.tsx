"use client";
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  type?: 'task' | 'event' | 'test';
  isImportant?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  type = 'task',
  isImportant = false,
}) => {
  const typeStyles = {
    task: 'border-blue-200 bg-blue-50',
    event: 'border-green-200 bg-green-50',
    test: 'border-red-200 bg-red-50',
  };

  const importantStyles = isImportant ? 'border-l-4 border-l-yellow-500' : '';

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[type]} ${importantStyles} ${className}`}>
      {children}
    </div>
  );
};

export default Card;