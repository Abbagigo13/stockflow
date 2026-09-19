import {
  Brain,
  Check,
  ChevronRight,
  Circle,
  CircleDollarSign,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

import { usePortfolioAI } from "../hooks/usePortfolioAI";
import {
  fetchAssetFromServer,
  getSolanaDeployment,
} from "../lib/market";

import { fetchJupiterQuote } from "../lib/jupiterQuote";
import DevnetDemoPanel from "../components/DevnetDemoPanel";

export default function Portfolio({
  address,
  onConnect,
}) {
  const [amount, setAmount] = useState("100");
  const [riskProfile, setRiskProfile] =
    useState("balanced");

  const [goals, setGoals] = useState([
  "Growth",
  "Diversification",
]);

const [reviewing, setReviewing] = useState(false);
const [confirmed, setConfirmed] = useState(false);
const [transactionPreview, setTransactionPreview] =
  useState(false);
const [quoteResults, setQuoteResults] = useState([]);
const [quoteLoading, setQuoteLoading] = useState(false);
const [quoteError, setQuoteError] = useState("");

  const {
    portfolio,
    loading,
    error,
    generate,
    reset,
  } = usePortfolioAI();

  const goalOptions = [
    "Growth",
    "Diversification",
    "Income",
  ];

  function toggleGoal(goal) {
    setGoals((current) => {
      if (current.includes(goal)) {
        return current.filter(
          (item) => item !== goal
        );
      }

      return [...current, goal];
    });
  }

  async function handleGenerate() {
    await generate({
      amount: Number(amount),
      riskProfile,
      goals,
    });
  }
  async function handleCheckQuotes() {
  if (!portfolio?.allocations?.length) {
    setQuoteError("No portfolio allocations found.");
    return;
  }

  setQuoteLoading(true);
  setQuoteError("");
  setQuoteResults([]);

  try {
    const results = await Promise.all(
      portfolio.allocations.map(async (item) => {
        try {
          const asset = await fetchAssetFromServer(item.symbol);
          const solana = getSolanaDeployment(asset);

          if (!solana?.address) {
            return {
              symbol: item.symbol,
              amount: item.amount,
              status: "Unavailable",
              error: "No Solana deployment found",
            };
          }

          const quote = await fetchJupiterQuote({
            outputMint: solana.address,
            amountUsd: Number(item.amount),
          });

          return {
  symbol: item.symbol,
  amount: item.amount,
  mint: solana.address,
  decimals: solana.decimals ?? 6,
  status: "Quote available",
  quote,
};
        } catch (error) {
          return {
            symbol: item.symbol,
            amount: item.amount,
            status: "Failed",
            error:
  error?.message ||
  "Quote request failed",
          };
        }
      })
    );

    setQuoteResults(results);
  } catch (error) {
    setQuoteError(
      error?.message ||
        "Unable to check portfolio quotes"
    );
  } finally {
    setQuoteLoading(false);
  }
}

  function formatTokenAmount(amount, decimals = 6) {
    if (!amount) return "—";

    const numericAmount = Number(amount) / 10 ** decimals;

    if (!Number.isFinite(numericAmount)) {
      return "—";
    }

    return numericAmount.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    });
  }

  function formatMoney(value) {
    if (value == null) return "$0.00";

    return `$${Number(value).toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  }

  function formatPercentage(value) {
    return `${Number(value || 0).toFixed(0)}%`;
  }

  return (
    <div className="portfolio-page">
      {reviewing && portfolio && (
  <div className="portfolio-review-overlay">
    <div className="portfolio-review-card">

      <div className="review-header">
        <div>
          <span>STOCKFLOW AI</span>
          <h2>Review your portfolio</h2>
          <p>
            Check the proposed allocations before
            proceeding to any onchain transaction.
          </p>
        </div>

        <button
          className="new-portfolio-button"
          onClick={() => setReviewing(false)}
        >
          Back
        </button>
      </div>

      <div className="review-total">
        <span>TOTAL INVESTMENT</span>
        <strong>
          {formatMoney(portfolio.totalInvestment)}
        </strong>
      </div>

      <div className="review-details">
        <div>
          <span>RISK PROFILE</span>
          <strong>
            {portfolio.riskProfile || riskProfile}
          </strong>
        </div>

        <div>
          <span>AI SCORE</span>
          <strong>
            {portfolio.aiScore ?? "—"}
          </strong>
        </div>

        <div>
          <span>CONFIDENCE</span>
          <strong>
            {portfolio.confidence ?? "—"}
          </strong>
        </div>
      </div>

      <section className="review-allocation">
        <span>PROPOSED ALLOCATION</span>
        <h3>Assets to review</h3>

        {portfolio.allocations.map((item) => (
          <div
            className="review-allocation-row"
            key={item.symbol}
          >
            <div>
              <strong>{item.symbol}</strong>
              <p>{item.reason}</p>
            </div>

            <div>
              <strong>
                {formatPercentage(item.percentage)}
              </strong>
              <span>
                {formatMoney(item.amount)}
              </span>
            </div>
          </div>
        ))}
      </section>

      <div className="review-notice">
        <ShieldCheck size={18} />
        <p>
          This is a hypothetical AI-generated allocation.
          No transaction has been created or submitted.
        </p>
      </div>

      {!confirmed ? (
        <button
          className="generate-portfolio-button"
          onClick={() => setConfirmed(true)}
        >
          Confirm Portfolio Review
          <ChevronRight size={17} />
        </button>
      ) : (
        <div className="review-confirmed-content">
        <div className="review-confirmed">
  <Check size={18} />

  <strong>
    Portfolio review confirmed.
  </strong>

  <p>
    Your allocation review is complete.
    No transaction has been submitted.
  </p>

  <button
    className="generate-portfolio-button"
    onClick={() => setTransactionPreview(true)}
  >
    View Transaction Preview
    <ChevronRight size={17} />
  </button>
</div>
{transactionPreview && (
  <div className="transaction-preview">
    <div className="review-header">
      <div>
        <span>ONCHAIN PREVIEW</span>
        <h3>Transaction details</h3>
        <p>
          Review the intended investment before
          connecting a swap route.
        </p>
      </div>
    </div>

    <div className="review-details">
      <div>
        <span>NETWORK</span>
        <strong>Solana</strong>
      </div>

      <div>
        <span>WALLET</span>
        <strong>
          {address
            ? `${address.slice(0, 6)}...${address.slice(-6)}`
            : "Not connected"}
        </strong>
      </div>

      <div>
        <span>STATUS</span>
        <strong>Preview only</strong>
      </div>
    </div>

    <div className="review-notice">
      <ShieldCheck size={18} />
      <p>
        No wallet signature has been requested.
        No funds will be transferred from this preview.
      </p>
    </div>

    <div className="transaction-preview-actions">
  <button
    className="generate-portfolio-button"
    onClick={handleCheckQuotes}
    disabled={quoteLoading}
  >
    {quoteLoading
      ? "Checking routes..."
      : "Check Jupiter Quotes"}
    <ChevronRight size={17} />
  </button>

  <button
    className="new-portfolio-button"
    onClick={() => setTransactionPreview(false)}
  >
    Close Preview
  </button>
</div>
{quoteError && (
  <div className="portfolio-error">
    <X size={17} />
    <span>{quoteError}</span>
  </div>
)}

{quoteResults.length > 0 && (
  <div className="quote-results">
    <div className="review-header">
      <div>
        <span>JUPITER ROUTES</span>
        <h3>Quote results</h3>
      </div>
    </div>

    {quoteResults.map((result) => (
      <div
        className="review-allocation-row"
        key={result.symbol}
      >
        <div>
          <strong>{result.symbol}</strong>
          <p>
            {formatMoney(result.amount)}
          </p>
        </div>

        <div>
          <strong>{result.status}</strong>
          {result.quote?.outAmount && (
  <span>
    Estimated output:{" "}
    {formatTokenAmount(
      result.quote.outAmount,
      result.decimals
    )}{" "}
    tokens
  </span>
)}
          {result.error && (
            <span>{result.error}</span>
          )}
        </div>
      </div>
    ))}
  </div>
)}

<DevnetDemoPanel
  address={address}
  allocations={portfolio.allocations}
/>

  </div>
)}

        </div>

      )}

    </div>
  </div>
)}

      {/* HEADER */}

      <div className="page-heading">

        <span>STOCKFLOW AI</span>

        <h1>
          Build your portfolio
        </h1>

        <p>
          Let StockFlow AI create a diversified
          tokenized-equity portfolio using live
          Solana market data.
        </p>

      </div>

      {!portfolio ? (

        <div className="portfolio-builder">

          {/* WALLET */}

          <div className="portfolio-wallet">

            <div className="portfolio-wallet-icon">
              <Wallet size={18} />
            </div>

            <div>

              <span>
                SOLANA WALLET
              </span>

              <strong>
                {address
                  ? `${address.slice(
                      0,
                      6
                    )}...${address.slice(-6)}`
                  : "Not connected"}
              </strong>

            </div>

            {!address && (
              <button
                className="portfolio-connect"
                onClick={onConnect}
              >
                Connect
              </button>
            )}

            {address && (
              <div className="portfolio-connected">
                <CircleDollarSign
                  size={14}
                />
                Connected
              </div>
            )}

          </div>

          {/* AMOUNT */}

          <section className="builder-section">

            <div className="builder-section-heading">

              <span>
                01
              </span>

              <div>
                <strong>
                  Investment amount
                </strong>

                <p>
                  How much would you like
                  the AI to allocate?
                </p>
              </div>

            </div>

            <div className="amount-input">

              <span>$</span>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    event.target.value
                  )
                }
                placeholder="100"
              />

            </div>

          </section>

          {/* RISK */}

          <section className="builder-section">

            <div className="builder-section-heading">

              <span>
                02
              </span>

              <div>
                <strong>
                  Investment style
                </strong>

                <p>
                  Choose how much risk the
                  portfolio should consider.
                </p>
              </div>

            </div>

            <div className="risk-options">

              {[
                {
                  id: "conservative",
                  title: "Conservative",
                  description:
                    "Lower volatility",
                },
                {
                  id: "balanced",
                  title: "Balanced",
                  description:
                    "Diversified exposure",
                },
                {
                  id: "aggressive",
                  title: "Aggressive",
                  description:
                    "Higher growth focus",
                },
              ].map((option) => (

                <button
                  key={option.id}
                  className={`risk-option ${
                    riskProfile ===
                    option.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setRiskProfile(
                      option.id
                    )
                  }
                >

                  <div className="risk-check">

                    {riskProfile ===
                      option.id && (
                      <Check size={13} />
                    )}

                  </div>

                  <div>

                    <strong>
                      {option.title}
                    </strong>

                    <span>
                      {option.description}
                    </span>

                  </div>

                </button>

              ))}

            </div>

          </section>

          {/* GOALS */}

          <section className="builder-section">

            <div className="builder-section-heading">

              <span>
                03
              </span>

              <div>
                <strong>
                  What matters most?
                </strong>

                <p>
                  Select the goals the AI
                  should consider.
                </p>
              </div>

            </div>

            <div className="goal-options">

              {goalOptions.map((goal) => {

                const selected =
                  goals.includes(goal);

                return (
                  <button
                    key={goal}
                    className={`goal-option ${
                      selected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      toggleGoal(goal)
                    }
                  >

                    {selected ? (
                      <Check size={14} />
                    ) : (
                      <Circle size={14} />
                    )}

                    {goal}

                  </button>
                );
              })}

            </div>

          </section>

          {/* ERROR */}

          {error && (
            <div className="portfolio-error">

              <X size={17} />

              <div>

                <strong>
                  Portfolio generation failed
                </strong>

                <span>
                  {error}
                </span>

              </div>

            </div>
          )}

          {/* GENERATE */}

          <button
            className="generate-portfolio-button"
            onClick={handleGenerate}
            disabled={
              loading ||
              !amount ||
              Number(amount) <= 0
            }
          >

            {loading ? (
              <>
                <Sparkles
                  size={17}
                  className="spin"
                />

                Analyzing markets...
              </>
            ) : (
              <>
                <Brain size={17} />

                Generate AI Portfolio

                <ChevronRight
                  size={17}
                />
              </>
            )}

          </button>

          <p className="portfolio-disclaimer">
            StockFlow AI generates hypothetical
            portfolio analysis using available
            market data. It is not financial advice
            and does not guarantee returns.
          </p>

        </div>

      ) : (

        /* AI RESULT */

        <div className="portfolio-result">

          <div className="result-header">

            <div>

              <span>
                STOCKFLOW AI
              </span>

              <h2>
                Your AI portfolio
              </h2>

              <p>
                Generated from live tokenized
                equity market data.
              </p>

            </div>

            <button
              className="new-portfolio-button"
              onClick={reset}
            >
              Build another
            </button>

          </div>

          {/* SCORE CARDS */}

          <div className="portfolio-score-grid">

            <div className="portfolio-score-card">

              <span>
                AI SCORE
              </span>

              <strong>
                {portfolio.aiScore ?? "—"}
              </strong>

            </div>

            <div className="portfolio-score-card">

              <span>
                DIVERSIFICATION
              </span>

              <strong>
                {portfolio.diversificationScore ??
                  "—"}
              </strong>

            </div>

            <div className="portfolio-score-card">

              <span>
                CONFIDENCE
              </span>

              <strong>
                {portfolio.confidence ?? "—"}
              </strong>

            </div>

            <div className="portfolio-score-card">

              <span>
                INVESTMENT
              </span>

              <strong>
                {formatMoney(
                  portfolio.totalInvestment
                )}
              </strong>

            </div>

          </div>

          {/* SUMMARY */}

          <div className="portfolio-summary">

            <div className="portfolio-summary-icon">
              <Brain size={19} />
            </div>

            <div>

              <span>
                AI ANALYSIS
              </span>

              <p>
                {portfolio.summary ||
                  "StockFlow AI generated this portfolio from the supplied market data."}
              </p>

            </div>

          </div>

          {/* ALLOCATIONS */}

          <section className="allocation-section">

            <div className="allocation-heading">

              <div>
                <span>
                  ALLOCATION
                </span>

                <h3>
                  Portfolio composition
                </h3>
              </div>

              <div className="risk-badge">
                <ShieldCheck size={14} />

                {portfolio.riskProfile ||
                  riskProfile}
              </div>

            </div>

            <div className="allocation-list">

              {portfolio.allocations.map(
                (item) => (

                  <div
                    className="allocation-row"
                    key={item.symbol}
                  >

                    <div className="allocation-symbol">

                      <strong>
                        {item.symbol}
                      </strong>

                      <span>
                        {formatPercentage(
                          item.percentage
                        )}
                      </span>

                    </div>

                    <div className="allocation-bar">

                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              Number(
                                item.percentage
                              )
                            )
                          )}%`,
                        }}
                      />

                    </div>

                    <strong className="allocation-amount">
                      {formatMoney(
                        item.amount
                      )}
                    </strong>

                    <p className="allocation-reason">
                      {item.reason}
                    </p>

                  </div>

                )
              )}

            </div>

          </section>

          {/* RISKS */}

          {Array.isArray(
            portfolio.risks
          ) &&
            portfolio.risks.length > 0 && (

              <section className="portfolio-risks">

                <div>

                  <span>
                    RISK FACTORS
                  </span>

                  <h3>
                    What to watch
                  </h3>

                </div>

                <ul>

                  {portfolio.risks.map(
                    (risk, index) => (
                      <li key={index}>
                        <Circle size={7} />
                        {risk}
                      </li>
                    )
                  )}

                </ul>

              </section>

            )}

          {/* ONCHAIN CTA */}

          <div className="onchain-portfolio-cta">

            <div className="onchain-cta-icon">
              <Wallet size={19} />
            </div>

            <div>

              <span>
                SOLANA EXECUTION
              </span>

              <h3>
                Review before going onchain
              </h3>

              <p>
                The next step will let you review
                these allocations and approve the
                transaction with your connected
                wallet.
              </p>

            </div>

           <button
  onClick={() => {
    setReviewing(true);
    setConfirmed(false);
  }}
>
  Review Portfolio
  <ChevronRight size={16} />
</button>

          </div>

          <p className="portfolio-disclaimer">
            This portfolio is hypothetical analysis
            generated by StockFlow AI. It is not
            financial advice and does not guarantee
            investment performance.
          </p>

        </div>

      )}

    </div>
  );
}