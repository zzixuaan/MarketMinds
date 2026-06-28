import Card from "../General/Card";
import "../../cssComponents/KeyMetricsCard.css"

function KeyMetricsCard() {
    return (
        <div className="metrics-card">
            <h3>Key Metrics</h3>

            <div className="metric-row">
                <span>Diversification Score</span>  
            </div>

            <div className="metric-row">
                <span>Risk Level</span>  
            </div>

            <div className="metric-row">
                <span>Sharpe Ratio</span>  
            </div>

            <div className="metric-row">
                <span>Sortino Ratio</span>  
            </div>

            <div className="metric-row">
                <span>Max Drawdown</span>  
            </div>

            <div className="metric-row">
                <span>Win Rate</span>  
            </div>

            <div className="metric-row">
                <span>Profit Factor</span>  
            </div>

        </div>
    )
}

export default KeyMetricsCard;