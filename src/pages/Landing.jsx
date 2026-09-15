import { 
  ArrowRight, 
  Brain, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  LineChart, 
  Zap, 
  TrendingUp, 
  BarChart3, 
  CheckCircle2 
} from "lucide-react";
import { motion } from "framer-motion";

export default function Landing({
  onLaunch,
  mobileOpen,
  setMobileOpen,
}) {
  return (
    <main className="landing">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-mark">SF</div>
          <span>StockFlow</span>
        </div>

        <div className={`nav-links ${mobileOpen ? "open" : ""}`}>
          <button
            onClick={() =>
              document
                .getElementById("intelligence")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Intelligence
          </button>

          <button
            onClick={() =>
              document
                .getElementById("onchain")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Onchain
          </button>

          <button
            onClick={() =>
              document
                .getElementById("terminal")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Terminal
          </button>

          <button
            className="nav-launch"
            onClick={onLaunch}
          >
            Launch Terminal
            <ArrowRight size={15} />
          </button>
        </div>

        <button
          className="mobile-menu"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Open menu"
        >
          ☰
        </button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-grid" />

        <div className="hero-content">
          <div className="eyebrow">
            <span className="status-dot" />
            AI MARKET INTELLIGENCE · SOLANA
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Understand markets.
            <br />
            <span>Own them onchain.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.1,
            }}
          >
            StockFlow is an AI-powered terminal for
            tokenized equities on Solana. Analyze markets,
            monitor onchain liquidity, and understand
            market integrity in real time.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.2,
            }}
          >
            <button
              className="primary-button"
              onClick={onLaunch}
            >
              Launch Terminal
              <ArrowRight size={17} />
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                document
                  .getElementById("intelligence")
                  ?.scrollIntoView({
                    behavior: "smooth",
                  })
              }
            >
              Explore StockFlow
            </button>
          </motion.div>

          <div className="hero-proof">
            <div>
              <strong>24/7</strong>
              <span>Onchain markets</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Market intelligence</span>
            </div>

            <div>
              <strong>Solana</strong>
              <span>Fast settlement</span>
            </div>
          </div>
        </div>

        {/* MARKET ORB */}
        <div className="hero-orb">
          <div className="orb-ring ring-one" />
          <div className="orb-ring ring-two" />

          <div className="orb-core">
            <div className="orb-dot" />
          </div>

          <div className="floating-data data-one">
            <span>NVDAx</span>
            <strong>$219.38</strong>
          </div>

          <div className="floating-data data-two">
            <span>ONCHAIN LIQUIDITY</span>
            <strong>$1.93M</strong>
          </div>

          <div className="floating-data data-three">
            <span>MARKET HEALTH</span>
            <strong>82%</strong>
          </div>
        </div>
      </section>

      {/* MARKET TICKER */}
      <section className="ticker-strip">
        <div className="ticker-item">
          <span>NVDAx</span>
          <strong>$219.38</strong>
          <em className="positive">+1.24%</em>
        </div>

        <div className="ticker-item">
          <span>AAPLx</span>
          <strong>$238.91</strong>
          <em className="positive">+0.81%</em>
        </div>

        <div className="ticker-item">
          <span>TSLAx</span>
          <strong>$341.72</strong>
          <em className="negative">-0.84%</em>
        </div>

        <div className="ticker-item">
          <span>SPYx</span>
          <strong>$648.32</strong>
          <em className="positive">+0.67%</em>
        </div>
      </section>

      {/* INTELLIGENCE */}
      <section
        id="intelligence"
        className="feature-section"
      >
        <div className="section-heading">
          <span className="section-label">
            MARKET INTELLIGENCE
          </span>

          <h2>
            A smarter way to read
            <br />
            <span>tokenized markets.</span>
          </h2>

          <p>
            StockFlow combines market data, AI analysis
            and onchain signals into one intelligent
            financial interface.
          </p>
        </div>

        <div className="feature-grid">
          <FeatureCard
            number="01"
            title="AI Analysis"
            icon={Brain}
            description="Turn raw market data into structured bull cases, bear cases, risks, sentiment and confidence."
          />

          <FeatureCard
            number="02"
            title="Market Integrity"
            icon={ShieldCheck}
            description="Compare onchain prices against reference markets and monitor deviations in real time."
          />

          <FeatureCard
            number="03"
            title="Onchain Liquidity"
            icon={Activity}
            description="Understand liquidity around tokenized equities directly on Solana."
          />

          <FeatureCard
            number="04"
            title="Programmable Ownership"
            icon={Cpu}
            description="Connect your Solana wallet and bring tokenized assets into a programmable financial environment."
          />

          <FeatureCard
            number="05"
            title="Real-Time Data"
            icon={LineChart}
            description="Monitor live tokenized-equity pricing and onchain market conditions."
          />

          <FeatureCard
            number="06"
            title="Solana Native"
            icon={Zap}
            description="Built around the speed, composability and transparency of the Solana ecosystem."
          />
        </div>
      </section>

      {/* ONCHAIN SECTION */}
      <section
        id="onchain"
        className="feature-section"
      >
        <div className="section-heading">
          <span className="section-label">
            BUILT ON SOLANA
          </span>

          <h2>
            Intelligence meets
            <br />
            <span>onchain ownership.</span>
          </h2>

          <p>
            StockFlow connects financial intelligence
            with the tokenized assets and liquidity that
            exist onchain.
          </p>
        </div>

        <div className="feature-grid">
          <FeatureCard
            number="01"
            title="Onchain Price"
            icon={TrendingUp}
            description="Track the current market price of tokenized equities through Solana liquidity."
          />

          <FeatureCard
            number="02"
            title="Reference Price"
            icon={BarChart3}
            description="Compare tokenized asset pricing against the underlying reference market."
          />

          <FeatureCard
            number="03"
            title="Price Integrity"
            icon={CheckCircle2}
            description="Measure how closely onchain prices align with their reference markets."
          />
        </div>
      </section>

      {/* TERMINAL PREVIEW / CTA */}
      <section
        id="terminal"
        className="cta-section"
      >
        <div>
          <span className="section-label">
            STOCKFLOW TERMINAL
          </span>

          <h2>
            Your market desk,
            <br />
            reimagined.
          </h2>

          <p>
            Analyze tokenized stocks, inspect onchain
            liquidity and let StockFlow AI turn market
            data into actionable intelligence.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onLaunch}
        >
          Enter Terminal
          <ArrowRight size={17} />
        </button>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="brand">
          <div className="brand-mark">SF</div>
          <span>StockFlow</span>
        </div>

        <span>
          AI market intelligence for tokenized equities.
        </span>

        <span>
          Built on Solana · 2026
        </span>
      </footer>
    </main>
  );
}

function FeatureCard({
  number,
  title,
  description,
  icon: Icon,
}) {
  return (
    <motion.div
      className="feature-card"
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <span
        style={{
          color: "#4aff9e",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        {number}
      </span>

      <div className="feature-icon">
        {Icon ? <Icon size={20} color="#4aff9e" /> : <span />}
      </div>

      <h3>{title}</h3>

      <p>{description}</p>

      <div className="card-arrow">
        <ArrowRight size={16} />
      </div>
    </motion.div>
  );
}