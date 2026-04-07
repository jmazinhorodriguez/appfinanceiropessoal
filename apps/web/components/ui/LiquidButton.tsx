import React from 'react';

export function LiquidButton({ children, onClick, variant = 'primary', ...props }: any) {
  const className = variant === 'primary' ? 'btn-primary' : 'btn-glass';
  return (
    <button className={className} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
