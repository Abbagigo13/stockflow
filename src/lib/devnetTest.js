import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

import {
  DEVNET_GENESIS_HASH,
  DEVNET_RPC_URL,
  MIN_TEST_BALANCE_LAMPORTS,
  TEST_TRANSFER_LAMPORTS,
  devnetExplorerTxUrl,
} from "./solanaNetworks";

export function getDevnetConnection() {
  return new Connection(DEVNET_RPC_URL, "confirmed");
}

// Same wallet object your existing useWallet hook uses,
// so the address and the signing wallet can never disagree.
export function getWalletProvider() {
  if (typeof window === "undefined") return null;
  return window.solana ?? null;
}

async function assertRpcIsDevnet(connection) {
  const genesisHash = await connection.getGenesisHash();

  if (genesisHash !== DEVNET_GENESIS_HASH) {
    throw new Error(
      "The app's RPC connection is not Solana Devnet. Nothing was sent."
    );
  }
}

/*
  Read-only checks. Nothing is signed or sent here.
  1. Is the app's RPC really Devnet?
  2. Is the connected wallet Phantom?
  3. Does the wallet have enough Devnet SOL?
*/
export async function runDevnetChecks(address) {
  if (!address) {
    throw new Error("Connect your wallet first.");
  }

  const connection = getDevnetConnection();
  const provider = getWalletProvider();

  const genesisHash = await connection.getGenesisHash();
  const rpcIsDevnet = genesisHash === DEVNET_GENESIS_HASH;

  let balanceLamports = 0;

  if (rpcIsDevnet) {
    balanceLamports = await connection.getBalance(
      new PublicKey(address),
      "confirmed"
    );
  }

  return {
    address,
    isPhantom: provider?.isPhantom === true,
    rpcIsDevnet,
    balanceSol: balanceLamports / LAMPORTS_PER_SOL,
    hasEnoughSol: balanceLamports >= MIN_TEST_BALANCE_LAMPORTS,
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/*
  Only reports success once the signature is found on DEVNET.
  If Phantom is not on Devnet, the signature will never appear
  here, so this also acts as proof of the wallet's network.
*/
async function waitForDevnetConfirmation(
  connection,
  signature,
  timeoutMs = 60000
) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { value } = await connection.getSignatureStatuses(
      [signature],
      { searchTransactionHistory: true }
    );

    const status = value?.[0];

    if (status?.err) {
      throw new Error(
        `The transaction failed on Devnet: ${JSON.stringify(status.err)}`
      );
    }

    if (
      status &&
      (status.confirmationStatus === "confirmed" ||
        status.confirmationStatus === "finalized")
    ) {
      return status;
    }

    await wait(2000);
  }

  throw new Error(
    "The transaction was not confirmed on Devnet within 60 seconds. " +
      "Check that Phantom Testnet Mode is on with Solana Devnet enabled."
  );
}

/*
  Harmless test: sends 0.001 Devnet SOL from your wallet to
  YOUR OWN address. The only cost is the tiny network fee.
  The transaction uses a Devnet blockhash, so it is built for Devnet.
*/
export async function sendDevnetSelfTransfer({
  address,
  onSubmitted,
}) {
  if (!address) {
    throw new Error("Connect your wallet first.");
  }

  const provider = getWalletProvider();

  if (
    !provider ||
    typeof provider.signAndSendTransaction !== "function"
  ) {
    throw new Error(
      "Phantom wallet not found. Please install or unlock Phantom."
    );
  }

  if (provider.publicKey?.toString() !== address) {
    throw new Error(
      "The wallet's active account changed. Reconnect and run the Devnet checks again."
    );
  }

  const connection = getDevnetConnection();
  await assertRpcIsDevnet(connection);

  const owner = new PublicKey(address);

  const balance = await connection.getBalance(owner, "confirmed");

  if (balance < MIN_TEST_BALANCE_LAMPORTS) {
    throw new Error(
      "Not enough Devnet SOL. Get free Devnet SOL from the faucet first."
    );
  }

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const transaction = new Transaction({
    feePayer: owner,
    blockhash,
    lastValidBlockHeight,
  }).add(
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: owner,
      lamports: TEST_TRANSFER_LAMPORTS,
    })
  );

  const { signature } = await provider.signAndSendTransaction(
    transaction
  );

  if (onSubmitted) {
    onSubmitted(signature);
  }

  await waitForDevnetConfirmation(connection, signature);

  return {
    signature,
    explorerUrl: devnetExplorerTxUrl(signature),
  };
}

/*
  Simulated swap preview. It only reshapes your AI allocations
  for display. It makes NO network requests and buys NO tokens.
  Mainnet xStock addresses and Jupiter routes are not used on Devnet.
*/
export function buildSimulatedSwapPreview(allocations) {
  if (!Array.isArray(allocations)) return [];

  return allocations.map((item) => ({
    symbol: item.symbol,
    percentage: Number(item.percentage) || 0,
    amountUsd: Number(item.amount) || 0,
    status: "Simulated only",
  }));
}