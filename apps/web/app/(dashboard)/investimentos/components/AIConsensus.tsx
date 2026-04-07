import React from 'react';
import { motion } from 'framer-motion';
import { Pin } from 'lucide-react';

interface AIConsensusProps {
  signal: number; // 0 a 100
  sentiment: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell';
}

export default function AIConsensus({ signal, sentiment }: AIConsensusProps) {
  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Pin size={18} color="var(--accent-blue)" />
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '1px', margin: 0 }}>AI CONSENSUS</h3>
      </div>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Signal Strength</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{signal}%</span>
        </div>
        
        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${signal}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{ 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--accent-blue), #00d2ff)',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sentiment:</span>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: 700, 
          color: sentiment.includes('Buy') ? 'var(--accent-green)' : (sentiment === 'Neutral' ? 'var(--text-primary)' : 'var(--accent-red)') 
        }}>{sentiment}</span>
      </div>
    </div>
  );
}
