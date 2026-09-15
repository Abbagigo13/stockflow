import {
  Blocks,
  Link2,
  Zap,
} from "lucide-react";

export default function SolanaSection() {
  return (
    <section className="landing-section solana-section">

      <div className="section-heading">

        <span>
          BUILT ON SOLANA
        </span>

        <h2>
          Markets become programmable.
        </h2>

        <p>
          StockFlow combines tokenized equities with
          Solana's fast, composable onchain infrastructure.
        </p>

      </div>

      <div className="solana-feature-grid">

        <div>
          <Zap size={22} />

          <h3>
            Fast
          </h3>

          <p>
            Designed around real-time onchain market data.
          </p>
        </div>

        <div>
          <Link2 size={22} />

          <h3>
            Composable
          </h3>

          <p>
            Tokenized stocks can interact with the broader
            Solana ecosystem.
          </p>
        </div>

        <div>
          <Blocks size={22} />

          <h3>
            Verifiable
          </h3>

          <p>
            Asset and market state can be connected directly
            to onchain infrastructure.
          </p>
        </div>

      </div>

    </section>
  );
}