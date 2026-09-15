export default function TerminalPreview() {
  return (
    <section className="terminal-preview-section">

      <div className="section-heading">

        <span>
          THE TERMINAL
        </span>

        <h2>
          Bloomberg intelligence.
          <br />
          Onchain rails.
        </h2>

      </div>

      <div className="terminal-preview">

        <div className="preview-topbar">

          <span>
            StockFlow Terminal
          </span>

          <span className="preview-live">
            ● LIVE
          </span>

        </div>

        <div className="preview-body">

          <div className="preview-sidebar">
            <span>Markets</span>
            <span>AI Intelligence</span>
            <span>Onchain Health</span>
            <span>Portfolio</span>
          </div>

          <div className="preview-content">

            <div className="preview-price">

              <span>
                NVDAx
              </span>

              <strong>
                $219.38
              </strong>

              <small>
                -0.39%
              </small>

            </div>

            <div className="preview-chart">

              <div className="preview-line">
                ╱╲___╱╲____╱╲___╱╲____╱╲
              </div>

            </div>

            <div className="preview-metrics">

              <div>
                <span>AI Score</span>
                <strong>82</strong>
              </div>

              <div>
                <span>Liquidity</span>
                <strong>$1.93M</strong>
              </div>

              <div>
                <span>Deviation</span>
                <strong>+0.51%</strong>
              </div>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
}