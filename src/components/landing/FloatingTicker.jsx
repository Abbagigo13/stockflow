import { motion } from "framer-motion";

export default function FloatingTicker({
  symbol,
  price,
  change,
  className = "",
}) {
  const positive = change >= 0;

  return (
    <motion.div
      className={`floating-ticker ${className}`}
      initial={{
        opacity: 0,
        y: 15,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.6,
      }}
    >
      <span>{symbol}</span>

      <strong>
        ${Number(price || 0).toFixed(2)}
      </strong>

      <small
        className={
          positive
            ? "positive-change"
            : "negative-change"
        }
      >
        {positive ? "+" : ""}
        {Number(change || 0).toFixed(2)}%
      </small>
    </motion.div>
  );
}