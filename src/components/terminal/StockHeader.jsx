import { TrendingDown, TrendingUp } from "lucide-react";

export default function StockHeader({ stock }) {
  if (!stock) return null;

  const change = Number(stock.priceChange24h || 0);
  const positive = change >= 0;

  return (
    <div className="stock-header flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">

      <div className="stock-identity flex items-center gap-4">

        {stock.logo ? (
          <img
            src={stock.logo}
            alt={stock.symbol}
            className="stock-logo w-12 h-12 rounded-xl object-contain bg-zinc-900 border border-zinc-800 p-2 shrink-0"
          />
        ) : (
          <div className="stock-logo-placeholder w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 text-base shrink-0 uppercase">
            {stock.symbol?.slice(0, 2)}
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {stock.symbol}
          </h2>

          <p className="text-sm text-zinc-400 font-medium">
            {stock.name}
          </p>
        </div>

      </div>

      <div className="stock-price flex flex-col items-start sm:items-end gap-1">

        <strong className="text-3xl font-bold tracking-tight text-white">
          ${Number(stock.price || 0).toFixed(2)}
        </strong>

        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
            positive
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {positive ? (
            <TrendingUp size={14} />
          ) : (
            <TrendingDown size={14} />
          )}

          {positive ? "+" : ""}
          {change.toFixed(2)}%
        </span>

      </div>

    </div>
  );
}