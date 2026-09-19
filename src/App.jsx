import { useState } from "react";

import "./App.css";

import Landing from "./pages/Landing";
import Terminal from "./pages/Terminal";
import Stock from "./pages/Stock";
import Portfolio from "./pages/Portfolio";

import { useWallet } from "./hooks/useWallet";

function App() {
  const [page, setPage] =
    useState("landing");

  const [selectedSymbol, setSelectedSymbol] =
    useState("NVDAx");

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const {
    address,
    connected,
    connecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  function navigate(
    nextPage,
    symbol = selectedSymbol
  ) {
    setSelectedSymbol(symbol);
    setPage(nextPage);
    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (page === "terminal") {
    return (
      <Terminal
        onNavigate={navigate}
        onSelectStock={(symbol) =>
          navigate("stock", symbol)
        }
        address={address}
        connected={connected}
        connecting={connecting}
        walletError={walletError}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
    );
  }

  if (page === "stock") {
    return (
      <Stock
        symbol={selectedSymbol}
        onBack={() =>
          navigate("terminal")
        }
      />
    );
  }

  if (page === "portfolio") {
    return (
      <Portfolio
        address={address}
        connected={connected}
        connecting={connecting}
        walletError={walletError}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />
    );
  }

  return (
    <Landing
      onLaunch={() =>
        navigate("terminal")
      }
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
    />
  );
}

export default App;