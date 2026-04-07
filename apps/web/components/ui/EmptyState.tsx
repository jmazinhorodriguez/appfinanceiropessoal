import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}

export function EmptyState({ emoji, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        backdropFilter: 'blur(20px)',
      }}
    >
      {emoji && (
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {emoji}
        </div>
      )}
      <h3 style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        color: 'rgba(255,255,255,0.92)', 
        marginBottom: '0.5rem' 
      }}>
        {title}
      </h3>
      <p style={{ 
        fontSize: '0.9rem', 
        color: 'rgba(255,255,255,0.60)', 
        marginBottom: '1.5rem',
        maxWidth: '300px'
      }}>
        {description}
      </p>
      
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#0a84ff',
            color: '#fff',
            border: 'none',
            borderRadius: '9999px',
            padding: '0.75rem 1.5rem',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(10,132,255,0.40)',
            transition: 'all 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}>
            {ctaLabel}
          </button>
        </Link>
      )}
    </motion.div>
  );
}
