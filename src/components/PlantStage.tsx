import React from 'react';
import { motion } from 'framer-motion';

interface PlantStageProps {
  stage: string;
}

export const PlantStage: React.FC<PlantStageProps> = ({ stage }) => {
  return (
    <motion.div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl">
      {stage}
    </motion.div>
  );
};
