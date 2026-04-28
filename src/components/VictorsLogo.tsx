import { motion } from "framer-motion";
import logo from "@/assets/victors-logo.jpg";

interface VictorsLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
}

const sizes = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
  xl: "h-24",
  "2xl": "h-32",
};

export const VictorsLogo = ({ className = "", size = "md" }: VictorsLogoProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`inline-flex items-center justify-center ${className}`}
    >
      <img
        src={logo}
        alt="Victor's Smart System"
        className={`${sizes[size]} w-auto object-contain drop-shadow-[0_0_18px_hsl(180_100%_50%/0.5)]`}
      />
    </motion.div>
  );
};
