'use client';

import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface DamageNumberProps {
  damage: number;
  x: number;
  y: number;
  isCrit?: boolean;
  isHeal?: boolean;
  onComplete: () => void;
}

/**
 * DamageNumber - floating damage text (React overlay)
 * Rendered as absolutely positioned div with CSS animation
 */
export default function DamageNumber({ 
  damage, 
  x, 
  y, 
  isCrit = false, 
  isHeal = false,
  onComplete 
}: DamageNumberProps) {
  
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  const textColor = isHeal 
    ? 'text-green-400' 
    : isCrit 
      ? 'text-yellow-400' 
      : 'text-white';
  
  const fontSize = isCrit ? 'text-2xl' : 'text-lg';
  const fontWeight = isCrit ? 'font-black' : 'font-bold';
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ 
        opacity: 0, 
        y: -40, 
        scale: isCrit ? 1.5 : 1.2 
      }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`absolute pointer-events-none ${textColor} ${fontSize} ${fontWeight} drop-shadow-lg`}
      style={{ 
        left: x, 
        top: y,
        textShadow: '0 0 8px rgba(0,0,0,0.8)'
      }}
    >
      {isHeal ? '+' : '-'}{Math.round(damage)}{isCrit && '!'}
    </motion.div>
  );
}
