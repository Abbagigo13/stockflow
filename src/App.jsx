import { useState } from "react";

import "./App.css";

import Landing from "./pages/Landing";
import Terminal from "./pages/Terminal";
import Stock from "./pages/Stock";

function App() {
  const [page, setPage] =
    useState("landing");

  const [selectedSymbol, setSelectedSymbol] =
    useState("NVDAx");

  const [mobileOpen, setMobileOpen] =
    useState(false);

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