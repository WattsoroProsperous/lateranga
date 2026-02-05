"use client";

import { motion, type HTMLMotionProps } from "motion/react";

interface MotionDivProps extends HTMLMotionProps<"div"> {
  delay?: number;
}

export function MotionDiv({ delay = 0, children, ...props }: MotionDivProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.4, 0, 0.2, 1] as const,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
