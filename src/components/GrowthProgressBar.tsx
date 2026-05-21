import React from 'react';
import { motion } from 'framer-motion';

interface GrowthProgressBarProps {
  progress: number;
  emotionalTone?: string;
}

export const GrowthProgressBar: React.FC<GrowthProgressBarProps> = ({ progress, emotionalTone = 'peaceful' }) => {
  const colors = {
    peaceful: 'oklch(0.65 0.18 155)',
    happy: 'oklch(0.7 0.22 95)',
    reflective: 'oklch(0.6 0.15 260)',
    bittersweet: 'oklch(0.62 0.2 30)',
  };
  const color = colors[emotionalTone] || colors.peaceful;

  return (
    <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      />
    </div>
  );
};
