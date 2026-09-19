import { useState } from "react";
import { Check, ChevronRight, ShieldCheck, X } from "lucide-react";

import {
  DEVNET_FAUCET_URL,
  MAINNET_EXECUTION_ENABLED,
  TEST_TRANSFER_LAMPORTS,
} from "../lib/solanaNetworks";

import {
  buildSimulatedSwapPreview,
  runDevnetChecks,
  sendDevnetSelfTransfer,
} from "../lib/devnetTest";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function friendlyError(error) {
  const message = error?.message || "Something went wrong.";

  if (error?.code === 4001 || /reject/i.test(message)) {
    return "You rejected the request in Phantom. Nothing was sent.";
  }

  return message;
}

export default function DevnetDemoPanel({ address, allocations }) {
  const [demoMode, setDemoMode] = useState(false);
  const [phantomModeConfirmed, setPhantomModeConfirmed] =
    useState(false);

  const [checks, setChecks] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [txStatus, setTxStatus] = useState("idle");
  const [txResult, setTxResult] = useState(null);
  const [txError, setTxError] = useState("");

  const testAmountSol = TEST_TRANSFER_LAMPORTS / 1_000_000_000;
  const sending =
    txStatus === "awaiting-wallet" || txStatus === "confirming";

  const checksMatchWallet = checks?.address === address;

  const canSend =
    demoMode &&
    Boolean(address) &&
    phantomModeConfirmed &&
    checksMatchWallet &&
    checks?.rpcIsDevnet === true &&
    checks?.hasEnoughSol === true &&
    !sending;

  const preview = buildSimulatedSwapPreview(allocations);

  async function handleRunChecks() {
    setChecking(true);
    setCheckError("");

    try {
      const result = await runDevnetChecks(address);
      setChecks(result);
    } catch (error) {
      setChecks(null);
      setCheckError(error?.message || "Devnet checks failed.");
    } finally {
      setChecking(false);
    }
  }

  async function handleSendTest() {
    setTxStatus("awaiting-wallet");
    setTxError("");
    setTxResult(null);

    try {
      const result = await sendDevnetSelfTransfer({
        address,
        onSubmitted: () => setTxStatus("confirming"),
      });

      setTxResult(result);
      setTxStatus("success");
    } catch (error) {
      setTxError(friendlyError(error));
      setTxStatus("error");
    }
  }

  return (
    <div
      style={{
        marginTop: "24px",
        paddingTop: "24px",
        borderTop: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="review-header">
        <div>
          <span>DEVNET DEMO MODE</span>
          <h3>Safe wallet testing</h3>
          <p>
            Test your wallet on Solana Devnet with free test
            SOL. Devnet has no real-world value.
          </p>
        </div>
      </div>

      <div className="review-notice">
        <ShieldCheck size={18} />
        <p>
          Mainnet execution is{" "}
          {MAINNET_EXECUTION_ENABLED ? "ENABLED" : "disabled"}.
          Nothing on this panel touches mainnet funds.
        </p>
      </div>

      <button
        className="new-portfolio-button"
        onClick={() => setDemoMode((current) => !current)}
      >
        {demoMode
          ? "Turn off Devnet Demo Mode"
          : "Turn on Devnet Demo Mode"}
      </button>

      {demoMode && (
        <div style={{ marginTop: "20px" }}>
          <p>
            <strong>Step 1.</strong> In Phantom, open Settings,
            then Developer Settings. Turn on Testnet Mode and
            enable <strong>Solana Devnet</strong> (not Solana
            Testnet). The website cannot read this setting, so
            please confirm it yourself:
          </p>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              margin: "12px 0",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={phantomModeConfirmed}
              onChange={(event) =>
                setPhantomModeConfirmed(event.target.checked)
              }
            />
            I turned on Testnet Mode and enabled Solana Devnet in
            Phantom
          </label>

          <p>
            <strong>Step 2.</strong> Get free Devnet SOL from the{" "}
            <a
              href={DEVNET_FAUCET_URL}
              target="_blank"
              rel="noreferrer"
            >
              Solana faucet
            </a>{" "}
            using your wallet address.
          </p>

          <p>
            <strong>Step 3.</strong> Run the read-only checks. They
            sign and send nothing.
          </p>

          <div className="transaction-preview-actions">
            <button
              className="generate-portfolio-button"
              onClick={handleRunChecks}
              disabled={!address || checking}
            >
              {checking ? "Checking..." : "Run Devnet checks"}
              <ChevronRight size={17} />
            </button>
          </div>

          {!address && (
            <p>Connect your wallet first to run the checks.</p>
          )}

          {checkError && (
            <div className="portfolio-error">
              <X size={17} />
              <span>{checkError}</span>
            </div>
          )}

          {checks && checksMatchWallet && (
            <>
              <div className="review-details">
                <div>
                  <span>APP NETWORK</span>
                  <strong>
                    {checks.rpcIsDevnet
                      ? "Devnet verified"
                      : "NOT Devnet"}
                  </strong>
                </div>

                <div>
                  <span>DEVNET BALANCE</span>
                  <strong>
                    {checks.balanceSol.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })}{" "}
                    SOL
                  </strong>
                </div>

                <div>
                  <span>WALLET</span>
                  <strong>
                    {checks.isPhantom
                      ? "Phantom detected"
                      : "Not Phantom"}
                  </strong>
                </div>
              </div>

              {!checks.isPhantom && (
                <p>
                  Warning: the connected wallet does not identify
                  as Phantom. Another wallet extension may be
                  answering. Use Phantom for this test.
                </p>
              )}

              {!checks.hasEnoughSol && (
                <p>
                  Not enough Devnet SOL for the test yet. Use the
                  faucet in Step 2, then run the checks again.
                </p>
              )}
            </>
          )}

          <p>
            <strong>Step 4.</strong> Send a harmless test: {" "}
            {testAmountSol} Devnet SOL from your wallet to your
            own address. You only pay the tiny network fee.
            Phantom sometimes shows a simulation warning on Devnet.
            Only approve the self-transfer shown by this panel.
          </p>

          <div className="transaction-preview-actions">
            <button
              className="generate-portfolio-button"
              onClick={handleSendTest}
              disabled={!canSend}
            >
              {txStatus === "awaiting-wallet"
                ? "Waiting for Phantom..."
                : txStatus === "confirming"
                ? "Confirming on Devnet..."
                : "Send Devnet test transaction"}
              <ChevronRight size={17} />
            </button>
          </div>

          {txError && (
            <div className="portfolio-error">
              <X size={17} />
              <span>{txError}</span>
            </div>
          )}

          {txStatus === "success" && txResult && (
            <div className="review-confirmed">
              <Check size={18} />
              <strong>Confirmed on Devnet.</strong>
              <p>
                The transaction was found on Solana Devnet, which
                also shows Phantom is on Devnet.{" "}
                <a
                  href={txResult.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on Solana Explorer (Devnet)
                </a>
              </p>
            </div>
          )}

          {preview.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <div className="review-header">
                <div>
                  <span>SIMULATED SWAP PREVIEW</span>
                  <h3>What StockFlow would do</h3>
                  <p>
                    No tokens are bought. Mainnet xStock addresses
                    and Jupiter routes are not used on Devnet.
                  </p>
                </div>
              </div>

              {preview.map((row) => (
                <div
                  className="review-allocation-row"
                  key={row.symbol}
                >
                  <div>
                    <strong>{row.symbol}</strong>
                    <p>{row.percentage.toFixed(0)}% of portfolio</p>
                  </div>

                  <div>
                    <strong>{formatMoney(row.amountUsd)}</strong>
                    <span>{row.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}