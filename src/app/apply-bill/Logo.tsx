// Logo.tsx
import React from "react";
import { motion } from "framer-motion";

export const Logo = () => (
  <a
    href="#"
    className="flex items-center space-x-2 py-1 text-base font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      IIT Mandi Bills
    </motion.span>
  </a>
);

export const LogoIcon = () => (
  <a
    href="#"
    className="flex items-center py-1 text-sm font-semibold text-black"
  >
    <img src="/iit.png" alt="IIT Mandi" className="h-8 w-8" />
  </a>
);