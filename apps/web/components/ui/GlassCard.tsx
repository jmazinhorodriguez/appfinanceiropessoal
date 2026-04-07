import React from 'react';

export function GlassCard({ children, style }: { children: React.ReactNode, style?: React.CSSProperties }) {
  return (
    <div className="lg-card" style={{ padding: 24, ...style }}>
      {children}
    </div>
  );
}
