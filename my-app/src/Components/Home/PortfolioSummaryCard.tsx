import "../../cssComponents/portfoliosummarycard.css";

function PortfolioSummaryCard() {
  return (
    <div className="portfolio-summary-card">
      <p className="portfolio-label">Portfolio Value</p>

      <h2 className="portfolio-value">(insert the value here)</h2>

      <p className="portfolio-gain">(insert green gain text here)</p>

      <div className="portfolio-chart-placeholder">
        (insert chart here)
      </div>

      <div className="portfolio-time-buttons">
        <button>1D</button>
        <button>1W</button>
        <button>1M</button>
        <button>3M</button>
        <button>1Y</button>
      </div>
    </div>
  );
}

export default PortfolioSummaryCard;