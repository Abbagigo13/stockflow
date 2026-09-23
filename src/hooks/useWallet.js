import { useEffect, useState } from "react";

export function useWallet() {
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!window.solana) {
      return;
    }

    const wallet = window.solana;

        // Check whether the wallet is already connected.
    // Deferred with queueMicrotask so this doesn't set state
    // synchronously during the effect's initial run.
    if (wallet.isConnected && wallet.publicKey) {
      queueMicrotask(() => {
        setAddress(wallet.publicKey.toString());
        setConnected(true);
      });
    }

    function handleConnect(publicKey) {
      const walletAddress =
        publicKey?.toString() ||
        wallet.publicKey?.toString();

      if (walletAddress) {
        setAddress(walletAddress);
        setConnected(true);
        setError(null);
      }
    }

    function handleDisconnect() {
      setAddress(null);
      setConnected(false);
    }

    wallet.on?.("connect", handleConnect);
    wallet.on?.("disconnect", handleDisconnect);

    return () => {
      wallet.off?.("connect", handleConnect);
      wallet.off?.("disconnect", handleDisconnect);
    };
  }, []);

  async function connectWallet() {
    setError(null);

    try {
      setConnecting(true);

      if (!window.solana) {
        throw new Error(
          "No Solana wallet detected. Please install Phantom."
        );
      }

      const response = await window.solana.connect();

      const walletAddress =
        response?.publicKey?.toString();

      if (!walletAddress) {
        throw new Error(
          "Wallet connected but no public key was returned."
        );
      }

      setAddress(walletAddress);
      setConnected(true);

      return walletAddress;
    } catch (err) {
      console.error("Wallet connection failed:", err);

      setError(
        err?.message ||
          "Failed to connect wallet."
      );

      return null;
    } finally {
      setConnecting(false);
    }
  }

  async function disconnectWallet() {
    setError(null);

    try {
      if (
        window.solana &&
        typeof window.solana.disconnect === "function"
      ) {
        await window.solana.disconnect();
      }
    } catch (err) {
      console.error(
        "Wallet disconnect failed:",
        err
      );
    } finally {
      setAddress(null);
      setConnected(false);
    }
  }

  return {
    address,
    connected,
    connecting,
    error,
    connectWallet,
    disconnectWallet,
  };
}