import "../../cssComponents/Portfolio/Advanced.css";
import { TOOLTIPS } from "../../services/tooltips";
import Tooltip from "../../Components/Portfolio/Tooltip";


interface AdvancedCardProps{
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    volatility: number;
}

function AdvancedCard({
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    volatility,
}: AdvancedCardProps) {

    const getRiskAdjustedLabel = () => {
        if (sharpeRatio >= 2) {
            return "Excellent";
        } 
        
        if (sharpeRatio >= 1) {
            return "Good";
        }

        if (sharpeRatio > 0) {
            return "Average";
        }

        return "Needs Improvement";
    };


    const getDrawdownLabel = () => {
        if (maxDrawdown > -5) {
            return "Stable";
        }

        if (maxDrawdown > -15) {
            return "Moderate";
        }

        return "High";
    };


    return (
        <div className="advanced-card">
            <h2>Advanced Analytics</h2>
            <div className="advanced-grid">
                <div className="advanced-item">
                    <div className = "card-title">
                        <span>Sharpe Ratio</span>
                        <Tooltip text={TOOLTIPS.advancedSharpeRatio}/>
                    </div>
                    <strong>{sharpeRatio.toFixed(2)}</strong>
                    <small>{getRiskAdjustedLabel()}</small>
                </div>
                <div className="advanced-item">
                    <div className = "card-title">
                        <span>Sortino Ratio</span>   
                        <Tooltip text={TOOLTIPS.advancedSortinoRatio}/>
                    </div>
                    <strong>{sortinoRatio.toFixed(2)}</strong>
                    <small>Downside adjusted</small>
                </div>
                <div className="advanced-item">
                    <div className = "card-title">
                        <span>Max Drawdown</span>
                        <Tooltip text={TOOLTIPS.advancedMaxDrawdown}/>
                    </div>
                    <strong
                        className={
                            maxDrawdown < -10
                                ? "negative"
                                : "positive"
                        }
                    >
                        {maxDrawdown.toFixed(2)}%
                    </strong>
                    <small>{getDrawdownLabel()}</small>
                </div>
                <div className="advanced-item">
                    <div className="card-title">
                        <span>Volatility</span>
                        <Tooltip text={TOOLTIPS.advancedVolatility}/>
                    </div>
                    <strong>
                        {volatility.toFixed(2)}%
                    </strong>
                    <small>
                        {
                            volatility < 10
                                ? "Low movement"
                                : volatility < 20
                                ? "Moderate movement"
                                : "High movement"
                        }
                    </small>
                </div>
            </div>
        </div>
    );
}


export default AdvancedCard;