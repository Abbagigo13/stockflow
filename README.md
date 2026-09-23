# StockFlow AI

**AI-powered market intelligence and portfolio building for tokenized equities (xStocks) on Solana.**

Live demo: <https://stockflow-kappa-three.vercel.app>

StockFlow lets anyone explore tokenized stocks trading on Solana, generate an AI-built portfolio from live market data, and safely test wallet transactions on Devnet before any real funds are ever involved.

---

## What it does

- **Market Terminal** — live prices, 24h change, liquidity, and price history charts for 10 tokenized stocks (NVDAx, AAPLx, TSLAx, SPYx, MSFTx, AMZNx, GOOGLx, METAx, QQQx, COINx), pulled from onchain Solana market data.
- **AI Portfolio Builder** — describe an investment amount, risk profile, and goals; an AI model (Qwen) proposes a diversified allocation across the tracked xStocks, with reasoning per asset.
- **Onchain page** — wallet status, connected network, your tokenized stock holdings, StockFlow transaction history, and a table of all tracked assets with their Solana token addresses.
- **Jupiter quotes** — real, live swap-quote data from Jupiter for each proposed allocation (quote-only; nothing is executed).
- **Devnet Demo Mode** — a guided, step-by-step flow to safely test wallet signing end-to-end (network verification, balance check, and a harmless self-transfer) using free Solana Devnet SOL, with clear on-screen confirmation at every step.
- **Price integrity view** — shows the onchain (Solana market) price next to the reference stock price for each asset, so you can see how closely the tokenized version tracks the real thing.

## Why Solana

Tokenized equities already trade on Solana today. StockFlow's wedge is the **investing** side of that: turning raw onchain price and liquidity data into something a normal person can actually use to build and understand a portfolio, with live prices only Solana can provide.

## Safety by design

- **Real mainnet execution is disabled.** StockFlow never signs or sends a real trade on mainnet. All swap information shown is quote-only.
- **Wallet signing is proven end-to-end on Devnet**, not on mainnet, so anyone can try the full flow — connect, verify, sign, confirm onchain — with zero financial risk.
- **StockFlow never holds your keys.** Every transaction, on any network, is signed in your own wallet (Phantom).
- **API keys never reach the browser.** Birdeye, Jupiter, and the AI provider are all called from server-side functions; the browser only talks to StockFlow's own API.
- **Rate limiting and input validation** on every server endpoint to prevent abuse of the underlying data and AI quotas.

## Tech stack

- **Frontend:** React + Vite
- **Backend:** Vercel serverless functions (`/api`)
- **Blockchain:** Solana (`@solana/web3.js`), Phantom wallet
- **Market data:** xStocks API, Jupiter Price API, Birdeye (historical prices)
- **AI:** Qwen (via DashScope), used for portfolio generation
- **Deployment:** Vercel

## Project structure

stockflow/
├── api/ # Server functions (Vercel)
│ ├── xstocks-asset.js # xStocks asset metadata proxy
│ ├── jupiter-quote.js # Jupiter swap quote proxy (quote-only)
│ ├── jupiter-price.js # Jupiter live price proxy (batched, cached)
│ ├── price-history.js # Birdeye historical price proxy (cached)
│ ├── qwen.js # AI portfolio generation proxy
│ └── _rateLimit.js # Shared per-visitor rate limiter
├── src/
│ ├── pages/ # Landing, Terminal, Stock, Portfolio, Onchain
│ ├── components/ # UI components (terminal, landing, portfolio review, Devnet demo)
│ ├── hooks/ # useWallet, useStock, usePortfolio, usePortfolioAI
│ ├── lib/ # market data, Solana config, Devnet test logic, activity log
│ └── data/stocks.js # Tracked asset list
└── README.md

## Running locally

**Requirements:** Node.js, npm, and the [Vercel CLI](https://vercel.com/docs/cli).

1. Clone the repo and install dependencies:

```bash
   git clone https://github.com/Abbagigo13/stockflow.git
   cd stockflow
   npm install
```

1. Create a `.env.local` file in the project root with:

BIRDEYE_API_KEY=your_birdeye_key
DASHSCOPE_API_KEY=your_dashscope_key
JUPITER_API_KEY=your_jupiter_key

   None of these are exposed to the browser — they're only used inside `/api` server functions.

1. Run the app (this runs both the frontend and the serverless functions together):

```bash
   vercel dev
```

1. Open `http://localhost:3000`.

## Trying the Devnet wallet test

1. Install [Phantom](https://phantom.app/) and switch it to **Devnet** (Settings → Developer Settings → Testnet Mode → Solana Devnet).
2. Get free Devnet SOL from the [Solana faucet](https://faucet.solana.com).
3. In StockFlow, generate an AI portfolio, open **Review Portfolio → Continue to Devnet test**, and follow the on-screen steps.
4. A tiny (0.001 SOL) self-transfer is signed and confirmed on Devnet, with a live Solana Explorer link once confirmed.

## Disclaimer

StockFlow AI generates hypothetical portfolio analysis using available market data. It is not financial advice and does not guarantee returns. Tokenized stock trading may not be available or legal in all jurisdictions — check local regulations before trading.

## Built for

[Stocklana](https://hackathons.solana.com/hackathons/stocklana) — a Solana Foundation hackathon for tokenized equities.
