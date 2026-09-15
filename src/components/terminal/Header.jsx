import { Bell, Search } from "lucide-react";

export default function Header({
  walletAddress,
  onConnect,
}) {
  return (
    <header className="app-header">

      <div className="header-search">

        <Search size={17} />

        <input
          placeholder="Search stocks..."
        />

        <kbd>
          /
        </kbd>

      </div>

      <div className="header-actions">

        <button className="icon-button">
          <Bell size={18} />
        </button>

        {walletAddress ? (
          <div className="wallet-pill">
            <span />
            {walletAddress.slice(0, 4)}...
            {walletAddress.slice(-4)}
          </div>
        ) : (
          <button
            className="header-wallet"
            onClick={onConnect}
          >
            Connect Wallet
          </button>
        )}

      </div>

    </header>
  );
}