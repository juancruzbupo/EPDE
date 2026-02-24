'use client';

import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, x: -20 },
};

export function AnimatedList({ children, className }: AnimatedListProps) {
  return (
    <AnimatePresence mode="popLayout">
      <div className={className}>
        {children.map((child, i) => (
          <motion.div
            key={i}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2, delay: i * 0.03 }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}
