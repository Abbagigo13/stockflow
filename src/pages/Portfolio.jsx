import { Wallet } from "lucide-react";
import PortfolioCard from "../components/terminal/PortfolioCard";

export default function Portfolio({
  address,
  onConnect,
}) {
  return (
    <div className="portfolio-page">

      <div className="page-heading">

        <span>
          PORTFOLIO
        </span>

        <h1>
          Your onchain positions
        </h1>

        <p>
          Connect your Solana wallet to view
          tokenized-equity positions.
        </p>

      </div>

      <PortfolioCard
        address={address}
        onConnect={onConnect}
      />

      {!address && (
        <div className="portfolio-empty">

          <Wallet size={30} />

          <h3>
            Connect your wallet
          </h3>

          <p>
            StockFlow will use your public wallet
            address to analyze your onchain portfolio.
          </p>

          <button onClick={onConnect}>
            Connect Solana Wallet
          </button>

        </div>
      )}

    </div>
  );
}