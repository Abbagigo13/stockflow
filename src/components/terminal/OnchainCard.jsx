import { useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";

export default function OnchainCard({ stock }) {
  const [copied, setCopied] = useState(false);

  if (!stock?.solana) return null;

  const address = stock.solana.address;

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log("Could not copy address");
    }
  }

  return (
    <div className="onchain-card bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6 text-white shadow-xl">

      {/* HEADER */}
      <div className="onchain-card-header flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div>
          <span className="section-label text-[10px] font-mono tracking-wider text-emerald-400 uppercase">
            ONCHAIN
          </span>
          <h3 className="text-xl font-bold tracking-tight text-white">
            Solana Asset
          </h3>
        </div>

        <div className="solana-dot px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          SOLANA
        </div>
      </div>

      {/* TOKEN ADDRESS */}
      <div className="onchain-address bg-zinc-900/80 border border-zinc-800 p-3.5 rounded-xl space-y-2">
        <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">
          Token Address
        </span>

        <div className="flex items-center justify-between gap-2 bg-zinc-950 px-3 py-2 rounded-lg border border-zinc-800/80">
          <code className="font-mono text-xs text-zinc-300 truncate select-all">
            {address}
          </code>

          <button
            onClick={copyAddress}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors shrink-0"
            title="Copy Address"
          >
            {copied ? (
              <Check size={15} className="text-emerald-400" />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </div>
      </div>

      {/* ONCHAIN STATS */}
      <div className="onchain-stats grid grid-cols-3 gap-2 bg-zinc-900/40 border border-zinc-800/60 p-3 rounded-xl text-center">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Atomic Swaps
          </span>
          <strong
            className={`text-xs font-bold ${
              stock.solana.supportsAtomicSwaps
                ? "text-emerald-400"
                : "text-zinc-400"
            }`}
          >
            {stock.solana.supportsAtomicSwaps
              ? "Supported"
              : "Unavailable"}
          </strong>
        </div>

        <div className="flex flex-col items-center border-x border-zinc-800 px-1">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Stablecoin
          </span>
          <strong className="text-xs font-bold text-zinc-200">
            {stock.solana.stablecoins?.[0]?.symbol || "USDC"}
          </strong>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase mb-1">
            Token Program
          </span>
          <strong className="text-xs font-bold text-zinc-200">
            Token
          </strong>
        </div>
      </div>

      {/* EXPLORER LINK */}
      <a
        href={`https://solscan.io/token/${address}`}
        target="_blank"
        rel="noreferrer"
        className="explorer-link inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition-colors"
      >
        View on Solscan
        <ExternalLink size={14} />
      </a>

    </div>
  );
}