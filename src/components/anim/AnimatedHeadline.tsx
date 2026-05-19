"use client";

import { motion, useReducedMotion } from "framer-motion";

type Props = {
  primary: string;
  secondary?: string;
  className?: string;
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const word = {
  hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] as any },
  },
};

export function AnimatedHeadline({ primary, secondary, className }: Props) {
  const reduced = useReducedMotion();
  const primaryWords = primary.split(/\s+/);
  const secondaryWords = secondary ? secondary.split(/\s+/) : [];

  if (reduced) {
    return (
      <h1 className={className}>
        <span className="block bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">
          {primary}
        </span>
        {secondary && <span className="block mt-2 text-white">{secondary}</span>}
      </h1>
    );
  }

  return (
    <h1 className={className}>
      <motion.span
        variants={container}
        initial="hidden"
        animate="show"
        className="block bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent leading-[1.05]"
      >
        {primaryWords.map((w, i) => (
          <motion.span
            key={`p-${i}`}
            variants={word}
            className="inline-block mr-[0.25em] last:mr-0"
          >
            {w}
          </motion.span>
        ))}
      </motion.span>

      {secondary && (
        <motion.span
          variants={container}
          initial="hidden"
          animate="show"
          className="block mt-2 text-white leading-[1.1]"
          style={{ animationDelay: "200ms" }}
        >
          {secondaryWords.map((w, i) => (
            <motion.span
              key={`s-${i}`}
              variants={word}
              className="inline-block mr-[0.25em] last:mr-0"
            >
              {w}
            </motion.span>
          ))}
        </motion.span>
      )}
    </h1>
  );
}
