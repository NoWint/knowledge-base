import type { Transition, Variants } from "framer-motion"

// 克制的弹簧动画 - 适用于大多数交互
export const subtleSpring: Transition = {
  type: "spring",
  stiffness: 350,
  damping: 28,
  mass: 0.6,
}

// 更轻的弹簧 - 适用于列表项和卡片
export const lightSpring: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
}

// 贝塞尔曲线 - 适用于页面过渡
export const smoothEase: [number, number, number, number] = [0.25, 0.1, 0.25, 1]

// 页面进入动画
export const pageIn: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: smoothEase },
  },
}

// 交错容器 - 子元素依次入场
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
}

// 卡片入场
export const cardIn: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...lightSpring },
  },
}

// 缩放淡入 - 适用于模态框和弹窗
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: smoothEase },
  },
}

// hover 微动效
export const hoverLift = {
  y: -2,
  transition: { duration: 0.2, ease: smoothEase },
}

// tap 微反馈
export const tapPress = {
  scale: 0.98,
  transition: { duration: 0.1 },
}
