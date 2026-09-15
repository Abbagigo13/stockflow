export default function AIScore({ analysis }) {
  if (!analysis) return null;

  const score = Math.max(
    0,
    Math.min(100, Number(analysis.score || 0))
  );

  const marketHealth = Math.max(
    0,
    Math.min(100, Number(analysis.marketHealth || 0))
  );

  const priceIntegrity = Math.max(
    0,
    Math.min(100, Number(analysis.priceIntegrity || 0))
  );

  const liquidityHealth = Math.max(
    0,
    Math.min(100, Number(analysis.liquidityHealth || 0))
  );

  const confidence = Math.max(
    0,
    Math.min(100, Number(analysis.confidence || 0))
  );

  const sentiment = (
    analysis.sentiment || "neutral"
  ).toLowerCase();

  const sentimentColor =
    sentiment === "bullish"
      ? "text-emerald-400"
      : sentiment === "bearish"
        ? "text-rose-400"
        : "text-amber-400";

  const risk = (
    analysis.risk || "medium"
  ).toLowerCase();

  const riskColor =
    risk === "low"
      ? "text-emerald-400"
      : risk === "high"
        ? "text-rose-400"
        : "text-amber-400";

  function getHealthColor(value) {
    if (value >= 75) return "text-emerald-400";
    if (value >= 50) return "text-amber-400";
    return "text-rose-400";
  }

  function getHealthBar(value) {
    if (value >= 75) return "bg-emerald-400";
    if (value >= 50) return "bg-amber-400";
    return "bg-rose-400";
  }

  return (
    <div className="ai-score-card bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col items-center space-y-6 shadow-xl">

      {/* HEADER */}
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase">
            Market Intelligence
          </p>

          <h3 className="text-sm font-semibold text-white mt-1">
            AI Market Score
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

          <span className="text-[10px] font-mono text-zinc-500 uppercase">
            Live Analysis
          </span>
        </div>
      </div>

      {/* SCORE RING */}
      <div
        className="ai-score-ring relative w-36 h-36 rounded-full flex items-center justify-center p-2.5 transition-all duration-700"
        style={{
          background: `conic-gradient(#10b981 ${score}%, #27272a 0deg)`,
        }}
      >
        <div className="ai-score-inner w-full h-full bg-zinc-950 rounded-full flex flex-col items-center justify-center border border-zinc-800/80 shadow-inner">

          <strong className="text-4xl font-extrabold text-white tracking-tight">
            {score}
          </strong>

          <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mt-0.5">
            AI SCORE
          </span>

          <span className={`text-[9px] font-mono uppercase mt-1 ${sentimentColor}`}>
            {sentiment}
          </span>

        </div>
      </div>

      {/* SENTIMENT / RISK / CONFIDENCE */}
      <div className="ai-score-details w-full grid grid-cols-3 gap-2 bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl text-center">

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Sentiment
          </span>

          <strong
            className={`text-xs font-bold tracking-wide ${sentimentColor}`}
          >
            {sentiment.toUpperCase()}
          </strong>
        </div>

        <div className="flex flex-col items-center border-x border-zinc-800 px-1">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Risk
          </span>

          <strong
            className={`text-xs font-bold tracking-wide ${riskColor}`}
          >
            {risk.toUpperCase()}
          </strong>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Confidence
          </span>

          <strong className="text-xs font-bold tracking-wide text-zinc-200">
            {confidence}%
          </strong>
        </div>

      </div>

      {/* MARKET HEALTH */}
      <div className="w-full space-y-4">

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Market Health
            </span>

            <span
              className={`text-xs font-bold ${getHealthColor(
                marketHealth
              )}`}
            >
              {marketHealth}
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getHealthBar(
                marketHealth
              )}`}
              style={{
                width: `${marketHealth}%`,
              }}
            />
          </div>
        </div>

        {/* PRICE INTEGRITY */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Price Integrity
            </span>

            <span
              className={`text-xs font-bold ${getHealthColor(
                priceIntegrity
              )}`}
            >
              {priceIntegrity}
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getHealthBar(
                priceIntegrity
              )}`}
              style={{
                width: `${priceIntegrity}%`,
              }}
            />
          </div>
        </div>

        {/* LIQUIDITY HEALTH */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">
              Liquidity Health
            </span>

            <span
              className={`text-xs font-bold ${getHealthColor(
                liquidityHealth
              )}`}
            >
              {liquidityHealth}
            </span>
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getHealthBar(
                liquidityHealth
              )}`}
              style={{
                width: `${liquidityHealth}%`,
              }}
            />
          </div>
        </div>

      </div>

      {/* FOOTNOTE */}
      <div className="w-full pt-2 border-t border-zinc-800/80">
        <p className="text-[9px] leading-relaxed text-zinc-600 font-mono">
          Score synthesized from price integrity, liquidity,
          market conditions and analytical confidence.
        </p>
      </div>

    </div>
  );
}