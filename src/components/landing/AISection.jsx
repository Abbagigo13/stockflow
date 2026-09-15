import { Brain, ShieldCheck, Sparkles } from "lucide-react";

export default function AISection() {
  const features = [
    {
      icon: Brain,
      title: "AI Market Intelligence",
      text: "Turn raw market and onchain data into structured analysis.",
    },
    {
      icon: ShieldCheck,
      title: "Risk Awareness",
      text: "Monitor liquidity, price deviation and market conditions.",
    },
    {
      icon: Sparkles,
      title: "Explainable Scores",
      text: "Understand why StockFlow assigns a market health score.",
    },
  ];

  return (
    <section className="landing-section">

      <div className="section-heading">

        <span>
          STOCKFLOW AI
        </span>

        <h2>
          Intelligence before action.
        </h2>

        <p>
          StockFlow transforms tokenized-equity data
          into a market intelligence layer designed
          for onchain markets.
        </p>

      </div>

      <div className="feature-grid">

        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <div
              className="feature-card"
              key={feature.title}
            >
              <Icon size={22} />

              <h3>
                {feature.title}
              </h3>

              <p>
                {feature.text}
              </p>
            </div>
          );
        })}

      </div>

    </section>
  );
}