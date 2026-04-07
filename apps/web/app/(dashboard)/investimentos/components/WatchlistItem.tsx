import React from 'react';

interface WatchlistItemProps {
  symbol: string;
  name: string;
  pair: string;
  price: string;
  change: number;
  logoColor: string;
  isActive?: boolean;
}

export default function WatchlistItem({ symbol, name, pair, price, change, logoColor, isActive }: WatchlistItemProps) {
  const isPositive = change >= 0;
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px',
      borderRadius: '12px',
      cursor: 'pointer',
      background: isActive ? 'var(--glass-bg-active)' : 'transparent',
      transition: 'var(--transition)',
      border: isActive ? '1px solid var(--glass-border-hover)' : '1px solid transparent'
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'var(--glass-bg-hover)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.currentTarget.style.background = 'transparent';
      }
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 'bold', fontSize: '14px'
        }}>
          {symbol.charAt(0)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{name} | {pair}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{symbol}</span>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <span style={{ fontWeight: 600, fontSize: '14px', color: 'white' }}>{price}</span>
        <span style={{ 
          fontSize: '12px', 
          fontWeight: 500,
          color: isPositive ? 'var(--accent-green)' : 'var(--accent-red)'
        }}>
          {isPositive ? '+' : ''}{change}%
        </span>
      </div>
    </div>
  );
}
