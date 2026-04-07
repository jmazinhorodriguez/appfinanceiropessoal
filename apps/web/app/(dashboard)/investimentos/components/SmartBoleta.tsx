import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Zap } from 'lucide-react';

interface SmartBoletaProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: { symbol: string; currentPrice: number };
}

export default function SmartBoleta({ isOpen, onClose, asset }: SmartBoletaProps) {
  const [percentage, setPercentage] = useState(50);
  const [amount, setAmount] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const price = asset?.currentPrice || 68.45;
  const balance = 100000; // Simulated balance
  const confidence = 94;
  
  useEffect(() => {
    // Simulated max amount based on balance
    const maxAmount = Math.floor(balance / price);
    setAmount(Math.max(1, Math.floor((percentage / 100) * maxAmount)));
  }, [percentage, price]);

  const total = amount * price;
  const fee = total * 0.001; // 0.1% simulated fee
  
  if (!isOpen) return null;

  const handleExecute = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      onClose();
    }, 1500);
  };

  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <AnimatePresence>
      <div className="modal-overlay" style={{ zIndex: 9999 }}>
        <motion.div 
          className="modal glass-card"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          style={{ padding: '0', maxWidth: '440px' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--header-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Smart Boleta</h2>
              <span className="badge badge-green" style={{ fontSize: '10px' }}>LIVE</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Minus size={18} /></button>
              <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            </div>
          </div>

          <div style={{ padding: '24px' }}>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginBottom: '24px' }}>
              Initializing Order Execution Parameters...
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label className="label">ASSET</label>
              <div className="input-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px', height: '20px', background: 'var(--accent-violet)', borderRadius: '50%', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {asset?.symbol.charAt(0) || 'B'}
                  </div>
                  <span style={{ fontWeight: 600 }}>{asset?.symbol || 'BTC/USD'}</span>
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Balance: ${balance.toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <label className="label">AMOUNT</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  style={{ fontSize: '16px', fontWeight: 600, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">PRICE</label>
                <div className="input-field" style={{ display: 'flex', alignItems: 'center', opacity: 0.7, padding: '0 14px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 600 }}>${price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={percentage} 
                onChange={(e) => setPercentage(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-blue)',
                  height: '4px',
                  background: 'var(--glass-border)',
                  borderRadius: '2px',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer'
                }}
              />
              <style dangerouslySetInnerHTML={{__html: `
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  height: 16px;
                  width: 16px;
                  border-radius: 50%;
                  background: var(--accent-blue);
                  cursor: pointer;
                  box-shadow: 0 0 10px rgba(10, 132, 255, 0.5);
                }
              `}}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: 'var(--text-tertiary)', fontSize: '11px' }}>
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="30" cy="30" r={radius} fill="transparent" stroke="var(--accent-blue)" strokeWidth="4" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {confidence}%
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', letterSpacing: '1px' }}>CONFIDENCE</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>AI Execution Logic</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Est. Fee <span style={{ color: 'var(--text-primary)' }}>${fee.toFixed(2)}</span></div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>Total <span style={{ color: 'white' }}>${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
              </div>
            </div>

            <button 
              className="btn btn-primary w-full" 
              onClick={handleExecute}
              disabled={isExecuting}
              style={{ 
                height: '56px', fontSize: '16px', fontWeight: 600, 
                background: 'linear-gradient(90deg, var(--accent-blue), #00d2ff)',
                boxShadow: '0 4px 20px rgba(10, 132, 255, 0.4)',
                border: 'none',
                color: 'white',
                borderRadius: '9999px',
                cursor: isExecuting ? 'not-allowed' : 'pointer'
              }}
            >
              {isExecuting ? <div className="spinner" /> : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Zap size={20} fill="currentColor" />
                  Execute Order
                </div>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
