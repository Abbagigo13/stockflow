import {
  Activity,
  Brain,
  LayoutDashboard,
  Wallet,
} from "lucide-react";

export default function Sidebar({
  active = "markets",
  onNavigate,
}) {
  const items = [
    {
      id: "markets",
      label: "Markets",
      icon: LayoutDashboard,
    },
    {
      id: "ai",
      label: "AI Intelligence",
      icon: Brain,
    },
    {
      id: "onchain",
      label: "Onchain Health",
      icon: Activity,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Wallet,
    },
  ];

  return (
    <aside className="terminal-sidebar">

      <div className="sidebar-brand">
        <div className="brand-mark">
          S
        </div>

        <span>
          StockFlow
        </span>
      </div>

      <nav>

        {items.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={
                active === item.id
                  ? "sidebar-item active"
                  : "sidebar-item"
              }
              onClick={() =>
                onNavigate?.(item.id)
              }
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}

      </nav>

      <div className="sidebar-footer">

        <div className="network-status">
          <span />
          Solana Devnet
        </div>

        <small>
          StockFlow v0.1
        </small>

      </div>

    </aside>
  );
}