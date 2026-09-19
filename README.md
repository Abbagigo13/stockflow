
# StockFlow AI

> AI intelligence for tokenized equities on Solana.

StockFlow AI is a Solana-focused AI portfolio and market intelligence application for tokenized equities (xStocks). It combines live market data, AI-generated portfolio allocations, Jupiter quote integration, and a planned wallet-based onchain execution flow.

## Project

- **Project name:** StockFlow AI
- **GitHub:** https://github.com/Abbagigo13/stockflow
- **Local path:** `C:\Users\PC\Downloads\stockflow`
- **Frontend:** React + Vite
- **Blockchain:** Solana
- **AI:** Qwen through a Vercel serverless API
- **Market data:** xStocks API and Jupiter Price API
- **Swap quotes:** Jupiter Swap API V2 through a server-side proxy

---

## Current progress

### Completed

- [x] React/Vite application setup
- [x] StockFlow landing page
- [x] Market terminal interface
- [x] AI Portfolio interface
- [x] AI portfolio generation through Qwen
- [x] xStocks asset data integration
- [x] Live Jupiter market prices
- [x] Phantom wallet connection hook
- [x] Jupiter quote-only integration
- [x] Server-side xStocks asset proxy
- [x] Jupiter quote proxy
- [x] Readable token output formatting
- [x] Quote results for SPYx, AAPLx, NVDAx, and TSLAx

### Latest confirmed quote results

The AI portfolio generated these allocations:

| Asset | Allocation | Status |
|---|---:|---|
| SPYx | $40 | Quote available |
| AAPLx | $25 | Quote available |
| NVDAx | $20 | Quote available |
| TSLAx | $15 | Quote available |

The displayed output amounts are converted from atomic units using the token decimals.

A temporary TSLAx `fetch failed` error occurred, but the quote succeeded when checked again.

---

## Important files

### Frontend

- `src/App.jsx`
- `src/App.css`
- `src/pages/Landing.jsx`
- `src/pages/Terminal.jsx`
- `src/pages/Stock.jsx`
- `src/pages/Portfolio.jsx`

### Wallet

- `src/hooks/useWallet.js`

### AI

- `src/hooks/usePortfolioAI.js`
- `src/lib/portfolioAI.js`
- `api/qwen.js`

### Market data

- `src/lib/market.js`

### Jupiter quotes

- `src/lib/jupiterQuote.js`
- `api/jupiter-quote.js`

### xStocks proxy

- `api/xstocks-asset.js`

---

## Current Jupiter architecture

The current integration is quote-only.

1. The AI generates portfolio allocations.
2. StockFlow retrieves the xStocks asset.
3. StockFlow finds the Solana deployment.
4. StockFlow obtains the Solana token address.
5. StockFlow requests a Jupiter quote using USDC as the input token.
6. StockFlow displays the estimated token output.
7. No wallet signature is requested.
8. No transaction is submitted.

The Jupiter quote endpoint is accessed through:

`/api/jupiter-quote`

The xStocks asset endpoint is accessed through:

`/api/xstocks-asset`

The frontend should not expose secret API keys.

---

## Environment variables

The project uses environment variables for server-side API access.

Known variables include:

```env
DASHSCOPE_API_KEY=your_key
JUPITER_API_KEY=your_key
```

Do not commit `.env`, `.env.local`, or any secret API keys to GitHub.

Confirm that the environment files are listed in `.gitignore`.

---

## Current safety status

The application currently displays Jupiter quotes only.

There is no completed live transaction execution flow.

Do not enable real mainnet fund transfers until:

- Wallet and network validation are implemented.
- Transaction details are shown clearly.
- The user explicitly confirms the transaction.
- The transaction is signed by the user's wallet.
- Execution and confirmation handling are tested carefully.

---

## Next development phase: Devnet

The next goal is to create a safe test environment.

### Important network distinction

Solana Devnet is separate from Solana mainnet.

The existing xStock token addresses and Jupiter mainnet quote routes should not automatically be assumed to work on Devnet.

The Devnet implementation should use Devnet-compatible tokens and transactions or a simulated swap flow.

### Planned Devnet tasks

- [ ] Add a network selector
- [ ] Add Devnet Demo Mode
- [ ] Connect Phantom to Devnet
- [ ] Validate the connected network
- [ ] Display wallet address and network
- [ ] Obtain free Devnet SOL from a faucet
- [ ] Test a harmless Devnet transaction
- [ ] Add simulated stock execution preview
- [ ] Keep real mainnet execution disabled by default

---

## Future mainnet execution

After the Devnet testing stage, investigate the Jupiter Swap API V2 execution flow.

Planned process:

1. Validate the connected wallet.
2. Validate the network.
3. Request a Jupiter order with a `taker` wallet address.
4. Display the order details.
5. Ask the user for explicit confirmation.
6. Request the wallet signature.
7. Submit the signed transaction through Jupiter.
8. Display execution status.
9. Confirm the transaction on Solana.
10. Handle errors and failed transactions safely.

Never claim a transaction succeeded without receiving confirmation from the execution and blockchain confirmation process.

---

## Development commands

Install dependencies:

```powershell
npm install
```

Build the application:

```powershell
npm run build
```

Start the development environment with Vercel serverless functions:

```powershell
vercel dev
```

Use `vercel dev` when testing the `/api/qwen`, `/api/jupiter-quote`, and `/api/xstocks-asset` endpoints.

---

## Git workflow

Check the current state:

```powershell
git status
```

View recent commits:

```powershell
git log --oneline -5
```

Stage changes:

```powershell
git add .
```

Create a commit:

```powershell
git commit -m "Update StockFlow project handoff"
```

Push to GitHub:

```powershell
git push origin main
```

The branch may differ. Check the current branch with:

```powershell
git branch --show-current
```

---

## Handoff instructions for future chats

When continuing this project, start from this README.

Current stopping point:

> Jupiter quote integration works for SPYx, AAPLx, NVDAx, and TSLAx. The next task is to implement a safe Devnet wallet-testing mode. Do not directly connect mainnet xStock quotes to Devnet transactions. Keep quote-only behavior safe while building wallet validation and a harmless Devnet test transaction.

Preferred development style:

- Provide complete copy-paste code.
- Give step-by-step PowerShell commands.
- Explain what each change does.
- Check the build after code changes.
- Avoid inventing token addresses.
- Do not request or expose secret API keys.
- Keep real transaction execution disabled until it is tested and explicitly confirmed.

---

## Last known project state

- Last known local commit: `79dd98f`
- Last known working tree: clean at the time of the recorded commit
- GitHub repository: `Abbagigo13/stockflow`
- AI portfolio generation: working
- Jupiter quote integration: working
- Devnet transaction flow: not yet implemented