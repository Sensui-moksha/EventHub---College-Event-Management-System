// Animation configurations for Framer Motion
import { Variants } from 'framer-motion';

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};

// Fade in animation
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
};

// Slide in from left
export const slideInLeftVariants: Variants = {
  hidden: {
    x: -50,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Slide in from right
export const slideInRightVariants: Variants = {
  hidden: {
    x: 50,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Slide in from bottom
export const slideInBottomVariants: Variants = {
  hidden: {
    y: 50,
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
};

// Scale in animation
export const scaleInVariants: Variants = {
  hidden: {
    scale: 0.8,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
};

// Modal animations
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Backdrop animation
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Stagger children animation
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

// Card hover animation
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  hover: {
    scale: 1.03,
    y: -5,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  tap: {
    scale: 0.98,
  },
};

// Button animation
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeInOut',
    },
  },
  tap: {
    scale: 0.95,
  },
};

// Success animation (for registration success)
export const successVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Bounce animation
export const bounceVariants: Variants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Pulse animation
export const pulseVariants: Variants = {
  initial: {
    scale: 1,
  },
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// List item animation
export const listItemVariants: Variants = {
  hidden: {
    x: -20,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
};

// Rotate in animation
export const rotateInVariants: Variants = {
  hidden: {
    rotate: -180,
    opacity: 0,
  },
  visible: {
    rotate: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

// Notification slide in
export const notificationVariants: Variants = {
  hidden: {
    x: 400,
    opacity: 0,
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  },
};

// Shimmer loading effect
export const shimmerVariants: Variants = {
  initial: {
    backgroundPosition: '-200% 0',
  },
  animate: {
    backgroundPosition: '200% 0',
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};
