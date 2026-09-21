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
import { addActivity } from "../lib/activity";

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

function Task({ number, done, title, children }) {
  return (
    <li className={`sfr-task ${done ? "done" : ""}`}>
      <span className="sfr-task-num">
        {done ? <Check size={14} /> : number}
      </span>

      <div className="sfr-task-body">
        <h4>{title}</h4>
        {children}
      </div>
    </li>
  );
}

export default function DevnetDemoPanel({
  address,
  allocations,
  onConnect,
}) {
  // On by default here, because this panel only opens on
  // the "Devnet test" step the user chose to visit.
  const [demoMode, setDemoMode] = useState(true);
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

  const checksMatchWallet =
    Boolean(address) && checks?.address === address;

  const checksOk =
    checksMatchWallet && checks?.rpcIsDevnet === true;

  const hasSol =
    checksMatchWallet && checks?.hasEnoughSol === true;

  let blocker = "";

  if (!address) {
    blocker = "Connect your wallet first.";
  } else if (!phantomModeConfirmed) {
    blocker = "Complete task 1 first: confirm Phantom is on Devnet.";
  } else if (!checksMatchWallet) {
    blocker = "Run the safety checks in task 3 first.";
  } else if (!checks.rpcIsDevnet) {
    blocker = "The app's network check failed, so nothing can be sent.";
  } else if (!checks.hasEnoughSol) {
    blocker =
      "Your wallet needs more Devnet SOL. See task 2, then run the checks again.";
  }

  const canSend = demoMode && !blocker && !sending;

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
            addActivity({
        kind: "Devnet test transfer (to self)",
        network: "devnet",
        signature: result.signature,
        address,
      });
      setTxStatus("success");
    } catch (error) {
      setTxError(friendlyError(error));
      setTxStatus("error");
    }
  }

  return (
    <div className="sfr-devnet">
      <div className="sfr-notice">
        <ShieldCheck size={18} />
        <p>
          Mainnet execution is{" "}
          {MAINNET_EXECUTION_ENABLED ? "ENABLED" : "disabled"}.
          Everything on this screen uses Solana Devnet, which has no
          real-world value.
        </p>
      </div>

      <div className="sfr-toggle-row">
        <div>
          <strong>Devnet Demo Mode</strong>
          <p>Turn it off to hide the wallet test.</p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={demoMode}
          aria-label="Devnet Demo Mode"
          className={`sfr-switch ${demoMode ? "on" : ""}`}
          onClick={() => setDemoMode((current) => !current)}
        >
          <span />
        </button>
      </div>

      {demoMode && (
        <>
          <ol className="sfr-tasks">
            <Task
              number={1}
              done={phantomModeConfirmed}
              title="Switch Phantom to Devnet"
            >
              <p>
                Open Phantom, then Settings, then Developer
                Settings. Turn on <strong>Testnet Mode</strong>{" "}
                and enable <strong>Solana Devnet</strong> (not
                Solana Testnet). Websites cannot read this
                setting, so please confirm it yourself.
              </p>

              <label className="sfr-check">
                <input
                  type="checkbox"
                  checked={phantomModeConfirmed}
                  onChange={(event) =>
                    setPhantomModeConfirmed(event.target.checked)
                  }
                />
                I turned on Testnet Mode and enabled Solana Devnet
              </label>
            </Task>

            <Task
              number={2}
              done={hasSol}
              title="Get free Devnet SOL"
            >
              <p>
                Request test SOL for your wallet address at the{" "}
                <a
                  href={DEVNET_FAUCET_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Solana faucet
                </a>
                . If the faucet limits you, wait a while and try
                again. Devnet SOL has no real value.
              </p>

              {address && (
                <code className="sfr-mono">{address}</code>
              )}
            </Task>

            <Task
              number={3}
              done={checksOk}
              title="Run the safety checks"
            >
              <p>
                Read-only. Nothing is signed or sent. This proves
                the app is talking to Devnet and reads your Devnet
                balance.
              </p>

              {!address ? (
                <>
                  <p className="sfr-muted">
                    Connect your wallet first.
                  </p>

                  {onConnect && (
                    <button
                      type="button"
                      className="sfr-btn sfr-btn-primary"
                      onClick={onConnect}
                    >
                      Connect wallet
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="sfr-btn sfr-btn-primary"
                  onClick={handleRunChecks}
                  disabled={checking}
                >
                  {checking
                    ? "Checking..."
                    : checks
                      ? "Run checks again"
                      : "Run Devnet checks"}
                  <ChevronRight size={16} />
                </button>
              )}

              {checkError && (
                <div className="sfr-error">
                  <X size={16} />
                  <span>{checkError}</span>
                </div>
              )}

              {checks && checksMatchWallet && (
                <>
                  <div className="sfr-stats">
                    <div className="sfr-stat">
                      <span>APP NETWORK</span>
                      <strong
                        className={
                          checks.rpcIsDevnet ? "ok" : "bad"
                        }
                      >
                        {checks.rpcIsDevnet
                          ? "Devnet verified"
                          : "NOT Devnet"}
                      </strong>
                    </div>

                    <div className="sfr-stat">
                      <span>DEVNET BALANCE</span>
                      <strong>
                        {checks.balanceSol.toLocaleString(
                          "en-US",
                          { maximumFractionDigits: 4 }
                        )}{" "}
                        SOL
                      </strong>
                    </div>

                    <div className="sfr-stat">
                      <span>WALLET</span>
                      <strong
                        className={
                          checks.isPhantom ? "ok" : "bad"
                        }
                      >
                        {checks.isPhantom
                          ? "Phantom detected"
                          : "Not Phantom"}
                      </strong>
                    </div>
                  </div>

                  {!checks.isPhantom && (
                    <p className="sfr-warn">
                      The connected wallet does not identify as
                      Phantom. Another wallet extension may be
                      answering. Use Phantom for this test.
                    </p>
                  )}

                  {!checks.hasEnoughSol && (
                    <p className="sfr-warn">
                      Not enough Devnet SOL yet. Use the faucet in
                      task 2, then run the checks again.
                    </p>
                  )}
                </>
              )}
            </Task>

            <Task
              number={4}
              done={txStatus === "success"}
              title="Send a harmless test transaction"
            >
              <p>
                Sends {testAmountSol} Devnet SOL from your wallet
                to your own address, so you only pay the tiny
                network fee. Phantom sometimes shows a simulation
                warning on Devnet. Only approve the self-transfer
                shown by this panel.
              </p>

              {blocker && !sending && (
                <p className="sfr-muted">{blocker}</p>
              )}

              <button
                type="button"
                className="sfr-btn sfr-btn-primary"
                onClick={handleSendTest}
                disabled={!canSend}
              >
                {txStatus === "awaiting-wallet"
                  ? "Waiting for Phantom..."
                  : txStatus === "confirming"
                    ? "Confirming on Devnet..."
                    : "Send Devnet test transaction"}
                <ChevronRight size={16} />
              </button>

              {txError && (
                <div className="sfr-error">
                  <X size={16} />
                  <span>{txError}</span>
                </div>
              )}

              {txStatus === "success" && txResult && (
                <div className="sfr-success">
                  <Check size={16} />

                  <span>
                    <strong>Confirmed on Devnet.</strong> The
                    transaction was found on Solana Devnet, which
                    also shows Phantom is on Devnet.{" "}
                    <a
                      href={txResult.explorerUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View on Solana Explorer (Devnet)
                    </a>
                  </span>
                </div>
              )}
            </Task>
          </ol>

          {preview.length > 0 && (
            <section className="sfr-section">
              <span className="sfr-eyebrow">
                SIMULATED SWAP PREVIEW
              </span>

              <p className="sfr-muted">
                What StockFlow would do. No tokens are bought.
                Mainnet xStock addresses and Jupiter routes are
                not used on Devnet.
              </p>

              {preview.map((row) => (
                <div className="sfr-quote" key={row.symbol}>
                  <div>
                    <strong>{row.symbol}</strong>
                    <span>
                      {row.percentage.toFixed(0)}% of portfolio
                    </span>
                  </div>

                  <div className="sfr-quote-right">
                    <strong>{formatMoney(row.amountUsd)}</strong>
                    <span className="sfr-pill muted">
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}