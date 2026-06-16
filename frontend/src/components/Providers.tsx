"use client";

import { MotionConfig } from "framer-motion";

/** App-wide client providers. MotionConfig honors the user's reduced-motion
 * preference so animations never fight accessibility settings. */
export default function Providers({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
