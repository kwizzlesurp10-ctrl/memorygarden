import { motion } from 'framer-motion'

interface FertilizerParticlesProps {
  tier: 'standard' | 'premium' | 'legendary'
  color: string
  glowColor: string
}

export function FertilizerParticles({ tier, color, glowColor }: FertilizerParticlesProps) {
  if (tier === 'standard') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => {
          const startX = Math.random() * 100
          const drift = (Math.random() - 0.5) * 30
          
          return (
            <motion.div
              key={`drop-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${startX}%`,
                top: '-10px',
                background: color,
                boxShadow: `0 0 8px ${glowColor}`,
              }}
              initial={{ 
                y: 0,
                x: 0,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                y: ['0vh', '110vh'],
                x: [0, drift, drift * 1.2],
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0.5],
              }}
              transition={{
                duration: 2 + Math.random() * 1,
                delay: i * 0.08,
                ease: 'easeIn',
                times: [0, 0.1, 0.8, 1],
              }}
            />
          )
        })}
        
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8
          const distance = 100 + Math.random() * 50
          
          return (
            <motion.div
              key={`ripple-${i}`}
              className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
              style={{
                background: color,
              }}
              initial={{ 
                scale: 0, 
                opacity: 0,
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.8, 0],
                x: `calc(-50% + ${Math.cos(angle * Math.PI / 180) * distance}px)`,
                y: `calc(-50% + ${Math.sin(angle * Math.PI / 180) * distance}px)`,
              }}
              transition={{
                duration: 1.5,
                delay: 0.5 + i * 0.08,
                ease: 'easeOut',
              }}
            />
          )
        })}
      </div>
    )
  }

  if (tier === 'premium') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = Math.random() * 360
          const startDistance = 20 + Math.random() * 40
          const endDistance = 150 + Math.random() * 100
          const spiralSpeed = Math.random() * 720 + 360
          
          return (
            <motion.div
              key={`spiral-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: '3px',
                height: '3px',
              }}
              initial={{ 
                x: '-50%',
                y: '-50%',
              }}
              animate={{
                x: [
                  `calc(-50% + ${Math.cos(angle * Math.PI / 180) * startDistance}px)`,
                  `calc(-50% + ${Math.cos((angle + spiralSpeed) * Math.PI / 180) * endDistance}px)`,
                ],
                y: [
                  `calc(-50% + ${Math.sin(angle * Math.PI / 180) * startDistance}px)`,
                  `calc(-50% + ${Math.sin((angle + spiralSpeed) * Math.PI / 180) * endDistance}px)`,
                ],
                scale: [0, 1.5, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.5,
                delay: i * 0.03,
                ease: 'easeOut',
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: color,
                  boxShadow: `0 0 12px ${glowColor}, 0 0 6px ${color}`,
                }}
              />
            </motion.div>
          )
        })}
        
        {Array.from({ length: 15 }).map((_, i) => {
          const startX = Math.random() * 100
          const startY = Math.random() * 100
          
          return (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
              }}
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [0, 1, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 1.2,
                delay: i * 0.08,
                ease: 'easeInOut',
                times: [0, 0.3, 0.7, 1],
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path
                  d="M10 0 L12 8 L20 10 L12 12 L10 20 L8 12 L0 10 L8 8 Z"
                  fill={color}
                  style={{
                    filter: `drop-shadow(0 0 4px ${glowColor})`,
                  }}
                />
              </svg>
            </motion.div>
          )
        })}
        
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full border-2"
            style={{
              borderColor: glowColor,
              width: '50px',
              height: '50px',
              x: '-50%',
              y: '-50%',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 6],
              opacity: [0.8, 0],
            }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
    )
  }

  if (tier === 'legendary') {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 360) / 60
          const burstRadius = 200 + Math.random() * 150
          const secondaryAngle = angle + (Math.random() - 0.5) * 60
          
          return (
            <motion.div
              key={`burst-${i}`}
              className="absolute left-1/2 top-1/2"
              style={{
                width: '4px',
                height: '4px',
              }}
              initial={{ 
                x: '-50%',
                y: '-50%',
                scale: 0,
              }}
              animate={{
                x: [
                  '-50%',
                  `calc(-50% + ${Math.cos(angle * Math.PI / 180) * burstRadius * 0.5}px)`,
                  `calc(-50% + ${Math.cos(secondaryAngle * Math.PI / 180) * burstRadius}px)`,
                ],
                y: [
                  '-50%',
                  `calc(-50% + ${Math.sin(angle * Math.PI / 180) * burstRadius * 0.5}px)`,
                  `calc(-50% + ${Math.sin(secondaryAngle * Math.PI / 180) * burstRadius}px)`,
                ],
                scale: [0, 2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 1.8,
                delay: i * 0.015,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `radial-gradient(circle, ${color}, ${glowColor})`,
                  boxShadow: `0 0 16px ${glowColor}, 0 0 8px ${color}`,
                }}
              />
            </motion.div>
          )
        })}
        
        {Array.from({ length: 30 }).map((_, i) => {
          const startAngle = Math.random() * 360
          const radius = 80 + Math.random() * 100
          
          return (
            <motion.div
              key={`orbit-${i}`}
              className="absolute left-1/2 top-1/2"
              initial={{ 
                x: '-50%',
                y: '-50%',
              }}
            >
              <motion.div
                className="w-3 h-3 rounded-full"
                style={{
                  background: color,
                  boxShadow: `0 0 12px ${glowColor}, 0 0 6px ${color}`,
                }}
                animate={{
                  x: [
                    `${Math.cos(startAngle * Math.PI / 180) * radius}px`,
                    `${Math.cos((startAngle + 360) * Math.PI / 180) * radius}px`,
                  ],
                  y: [
                    `${Math.sin(startAngle * Math.PI / 180) * radius}px`,
                    `${Math.sin((startAngle + 360) * Math.PI / 180) * radius}px`,
                  ],
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.04,
                  ease: 'easeInOut',
                }}
              />
            </motion.div>
          )
        })}
        
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: '100px',
              height: '100px',
              x: '-50%',
              y: '-50%',
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 8],
              opacity: [0.6, 0],
            }}
            transition={{
              duration: 2.5,
              delay: i * 0.15,
              ease: 'easeOut',
            }}
          />
        ))}
        
        {Array.from({ length: 20 }).map((_, i) => {
          const startX = Math.random() * 100
          const startY = Math.random() * 100
          const floatDistance = 50 + Math.random() * 100
          
          return (
            <motion.div
              key={`crown-${i}`}
              className="absolute"
              style={{
                left: `${startX}%`,
                top: `${startY}%`,
              }}
              initial={{ scale: 0, y: 0, rotate: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                y: [0, -floatDistance],
                rotate: [0, 360],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.06,
                ease: 'easeOut',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24">
                <path
                  d="M12 2 L15 9 L22 9 L16 14 L19 21 L12 16 L5 21 L8 14 L2 9 L9 9 Z"
                  fill={color}
                  style={{
                    filter: `drop-shadow(0 0 8px ${glowColor}) drop-shadow(0 0 4px ${color})`,
                  }}
                />
              </svg>
            </motion.div>
          )
        })}
        
        <motion.div
          className="absolute left-1/2 top-1/2 w-full h-full"
          style={{
            x: '-50%',
            y: '-50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 50%)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 3],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.5,
            ease: 'easeOut',
          }}
        />
      </div>
    )
  }

  return null
}
