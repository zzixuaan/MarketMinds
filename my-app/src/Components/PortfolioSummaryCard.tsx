/*import "../cssComponents/portfoliosummarycard.css";

function PortfolioSummaryCard() {
    return (
        <div>
            <p>Portfolio Value</p>
            <h2>(insert the value here)</h2>
            <p>(insert green gain text here)</p>
            <p>(insert chart Here)</p>
            <p>(insert time range buttons here)</p>
        </div>
    )
}

export default PortfolioSummaryCard;
*/

import "../cssComponents/portfoliosummarycard.css";

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