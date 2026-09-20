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
import { Fragment, useEffect, useState } from "react";

import { usePortfolioAI } from "../hooks/usePortfolioAI";
import {
  fetchAssetFromServer,
  getSolanaDeployment,
} from "../lib/market";

import { fetchJupiterQuote } from "../lib/jupiterQuote";
import DevnetDemoPanel from "../components/DevnetDemoPanel";

import "./PortfolioReview.css";

const REVIEW_STEPS = [
  {
    id: 1,
    label: "Review",
    title: "Review your portfolio",
    description:
      "Check the proposed allocations before proceeding to any onchain transaction.",
  },
  {
    id: 2,
    label: "Preview",
    title: "Transaction preview",
    description:
      "Review the intended investment before connecting a swap route.",
  },
  {
    id: 3,
    label: "Devnet test",
    title: "Devnet wallet test",
    description:
      "Try your wallet safely on Solana Devnet with free test SOL. Real mainnet execution is disabled.",
  },
];

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
  const [reviewStep, setReviewStep] = useState(1);
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

  // While the review modal is open: Esc closes it and the
  // page behind it does not scroll.
  useEffect(() => {
    if (!reviewing) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setReviewing(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [reviewing]);

  const goalOptions = [
    "Growth",
    "Diversification",
    "Income",
  ];

  const currentStep = REVIEW_STEPS[reviewStep - 1];

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
        <div
          className="sfr-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setReviewing(false);
            }
          }}
        >
          <div
            className="sfr-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sfr-title"
          >
            <div className="sfr-header">
              <div>
                <span className="sfr-eyebrow">
                  STOCKFLOW AI
                </span>

                <h2 id="sfr-title" className="sfr-title">
                  {currentStep.title}
                </h2>

                <p className="sfr-sub">
                  {currentStep.description}
                </p>
              </div>

              <button
                type="button"
                className="sfr-close"
                aria-label="Close review"
                onClick={() => setReviewing(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div
              className={`sfr-badge ${
                reviewStep === 3 ? "sfr-badge-devnet" : ""
              }`}
            >
              <ShieldCheck size={14} />
              {reviewStep === 3
                ? "Devnet · test funds only"
                : "Preview only · no real funds"}
            </div>

            <ol className="sfr-steps" aria-label="Progress">
              {REVIEW_STEPS.map((item, index) => {
                const state =
                  item.id < reviewStep
                    ? "done"
                    : item.id === reviewStep
                      ? "current"
                      : "todo";

                return (
                  <Fragment key={item.id}>
                    {index > 0 && (
                      <li
                        aria-hidden="true"
                        className={`sfr-step-line ${
                          item.id <= reviewStep ? "done" : ""
                        }`}
                      />
                    )}

                    <li
                      className={`sfr-step ${state}`}
                      aria-current={
                        state === "current"
                          ? "step"
                          : undefined
                      }
                    >
                      <span className="sfr-step-dot">
                        {state === "done" ? (
                          <Check size={13} />
                        ) : (
                          item.id
                        )}
                      </span>

                      <span className="sfr-step-label">
                        {item.label}
                      </span>
                    </li>
                  </Fragment>
                );
              })}
            </ol>

            {/* STEP 1: REVIEW */}

            {reviewStep === 1 && (
              <>
                <div className="sfr-total">
                  <span>TOTAL INVESTMENT</span>
                  <strong>
                    {formatMoney(portfolio.totalInvestment)}
                  </strong>
                </div>

                <div className="sfr-stats">
                  <div className="sfr-stat">
                    <span>RISK PROFILE</span>
                    <strong>
                      {portfolio.riskProfile || riskProfile}
                    </strong>
                  </div>

                  <div className="sfr-stat">
                    <span>AI SCORE</span>
                    <strong>
                      {portfolio.aiScore ?? "—"}
                    </strong>
                  </div>

                  <div className="sfr-stat">
                    <span>CONFIDENCE</span>
                    <strong>
                      {portfolio.confidence ?? "—"}
                    </strong>
                  </div>
                </div>

                <section className="sfr-section">
                  <span className="sfr-eyebrow">
                    PROPOSED ALLOCATION
                  </span>

                  {portfolio.allocations.map((item) => (
                    <div className="sfr-alloc" key={item.symbol}>
                      <div className="sfr-alloc-top">
                        <div>
                          <strong>{item.symbol}</strong>
                          <p>{item.reason}</p>
                        </div>

                        <div className="sfr-alloc-amount">
                          <strong>
                            {formatPercentage(item.percentage)}
                          </strong>
                          <span>{formatMoney(item.amount)}</span>
                        </div>
                      </div>

                      <div className="sfr-bar">
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                0,
                                Number(item.percentage) || 0
                              )
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </section>

                <div className="sfr-notice">
                  <ShieldCheck size={18} />
                  <p>
                    This is a hypothetical AI-generated
                    allocation. No transaction has been created
                    or submitted.
                  </p>
                </div>

                <div className="sfr-actions">
                  <button
                    type="button"
                    className="sfr-btn sfr-btn-ghost"
                    onClick={() => setReviewing(false)}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="sfr-btn sfr-btn-primary"
                    onClick={() => setReviewStep(2)}
                  >
                    Confirm review and continue
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: PREVIEW */}

            {reviewStep === 2 && (
              <>
                <div className="sfr-stats">
                  <div className="sfr-stat">
                    <span>NETWORK</span>
                    <strong>Solana</strong>
                  </div>

                  <div className="sfr-stat">
                    <span>WALLET</span>
                    <strong>
                      {address
                        ? `${address.slice(0, 6)}...${address.slice(-6)}`
                        : "Not connected"}
                    </strong>
                  </div>

                  <div className="sfr-stat">
                    <span>STATUS</span>
                    <strong>Preview only</strong>
                  </div>
                </div>

                <div className="sfr-notice">
                  <ShieldCheck size={18} />
                  <p>
                    No wallet signature has been requested. No
                    funds will be transferred from this preview.
                  </p>
                </div>

                <div className="sfr-actions start">
                  <button
                    type="button"
                    className="sfr-btn sfr-btn-primary"
                    onClick={handleCheckQuotes}
                    disabled={quoteLoading}
                  >
                    {quoteLoading
                      ? "Checking routes..."
                      : "Check Jupiter Quotes"}
                    <ChevronRight size={16} />
                  </button>
                </div>

                <p className="sfr-muted">
                  Quotes come from Jupiter on Solana mainnet. They
                  are estimates only, and nothing is executed.
                </p>

                {quoteError && (
                  <div className="sfr-error">
                    <X size={16} />
                    <span>{quoteError}</span>
                  </div>
                )}

                {quoteResults.length > 0 && (
                  <section className="sfr-section">
                    <span className="sfr-eyebrow">
                      JUPITER ROUTES
                    </span>

                    {quoteResults.map((result) => (
                      <div
                        className="sfr-quote"
                        key={result.symbol}
                      >
                        <div>
                          <strong>{result.symbol}</strong>
                          <span>
                            {formatMoney(result.amount)}
                          </span>
                        </div>

                        <div className="sfr-quote-right">
                          <span
                            className={`sfr-pill ${
                              result.status ===
                              "Quote available"
                                ? "ok"
                                : "bad"
                            }`}
                          >
                            {result.status}
                          </span>

                          {result.quote?.outAmount && (
                            <small>
                              Estimated output:{" "}
                              {formatTokenAmount(
                                result.quote.outAmount,
                                result.decimals
                              )}{" "}
                              tokens
                            </small>
                          )}

                          {result.error && (
                            <small>{result.error}</small>
                          )}
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <div className="sfr-actions">
                  <button
                    type="button"
                    className="sfr-btn sfr-btn-ghost"
                    onClick={() => setReviewStep(1)}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="sfr-btn sfr-btn-primary"
                    onClick={() => setReviewStep(3)}
                  >
                    Continue to Devnet test
                    <ChevronRight size={16} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: DEVNET TEST */}

            {reviewStep === 3 && (
              <>
                <DevnetDemoPanel
                  address={address}
                  allocations={portfolio.allocations}
                  onConnect={onConnect}
                />

                <div className="sfr-actions">
                  <button
                    type="button"
                    className="sfr-btn sfr-btn-ghost"
                    onClick={() => setReviewStep(2)}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="sfr-btn sfr-btn-primary"
                    onClick={() => setReviewing(false)}
                  >
                    Done
                  </button>
                </div>
              </>
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
                setReviewStep(1);
                setReviewing(true);
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