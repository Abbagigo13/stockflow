import { clusterApiUrl } from "@solana/web3.js";

/*
  SAFETY SWITCH
  Real mainnet execution stays OFF. StockFlow has no mainnet
  execution code today. Do not switch this on until mainnet
  execution has been built and tested carefully.
*/
export const MAINNET_EXECUTION_ENABLED = false;

// Public Devnet RPC (https://api.devnet.solana.com). No API key needed.
export const DEVNET_RPC_URL = clusterApiUrl("devnet");

// A fingerprint that is unique to Solana Devnet. Used to prove
// the app's RPC connection really is Devnet.
export const DEVNET_GENESIS_HASH =
  "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG";

// Test transaction: 0.001 SOL sent from your wallet to itself.
export const TEST_TRANSFER_LAMPORTS = 1_000_000;

// Needs a little extra for the network fee.
export const MIN_TEST_BALANCE_LAMPORTS = 2_000_000;

export const DEVNET_FAUCET_URL = "https://faucet.solana.com";

export function devnetExplorerTxUrl(signature) {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}