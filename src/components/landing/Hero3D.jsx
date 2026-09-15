import { motion } from "framer-motion";
import MarketGlobe from "./MarketGlobe";
import FloatingTicker from "./FloatingTicker";

export default function Hero3D() {
  return (
    <div className="hero-visual">

      <MarketGlobe />

      <FloatingTicker
        symbol="NVDAx"
        price={219.38}
        change={-0.39}
        className="ticker-one"
      />

      <FloatingTicker
        symbol="AAPLx"
        price={235.12}
        change={1.24}
        className="ticker-two"
      />

      <motion.div
        className="hero-ai-card"
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <span>AI SCORE</span>

        <strong>
          82
        </strong>

        <small>
          MARKET HEALTH
        </small>
      </motion.div>

    </div>
  );
}