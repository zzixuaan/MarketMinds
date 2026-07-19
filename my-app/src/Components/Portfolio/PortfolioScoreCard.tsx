import "../../cssComponents/Portfolio/PortfolioScoreCard.css";
import { TOOLTIPS } from "../../services/tooltips";
import Tooltip from "../../Components/Portfolio/Tooltip";


interface ScoreBreakdown {
    performance: number;
    riskManagement: number;
    diversification: number;
    consistency: number;
}

interface PortfolioScoreCardProps {
    score: number;
    breakdown: ScoreBreakdown;
}

function PortfolioScoreCard({
    score, breakdown
}: PortfolioScoreCardProps) {
    const getScoreLabel = () => {
        if (score >= 85) {
            return "Excellent";
        }
        if (score >= 70) {
            return "Strong";
        }
        if (score >= 50) {
            return "Developing";
        }
        return "Needs Improvement";
    };

    const findWeakestArea = () => {
        const areas = [
            { name: "Performance",
              value: breakdown.performance },
            { name: "Risk Management",
              value: breakdown.riskManagement },
            { name: "Diversification",
              value: breakdown.diversification },
            { name: "Consistency",
              value: breakdown.consistency }
        ];
        return areas.reduce((weakest, current) => 
                                current.value < weakest.value
                                ? current
                                : weakest);
    };

    const getAdvice = () => {
        const weakest = findWeakestArea();

        if (weakest.name === "Diversification") {
            return "Consider spreading your investments across more holdings.";
        }

        if (weakest.name === "Risk Management") {
            return "Review your volatility and downside risk.";
        }

        if (weakest.name === "Consistency") {
            return "Focus on maintaining stable performance over time.";
        }

        if (weakest.name === "Performance") {
            return "Focus on improving your portfolio returns.";
        }

        return "";
    };

    const weakest = findWeakestArea();

    return (
        <div className="portfolio-score-card">
            <div className="card-title">
                <h2>Portfolio Score</h2>
                <Tooltip text ={TOOLTIPS.portfolioScore}/>
            </div>
            <div className="score-number">
                {score}
                <span>/100</span>
            </div>
            <div className="score-label">
                {getScoreLabel()}
            </div>            
            <div className="score-warning">
                <strong> Needs attention:</strong>
                <p>
                    {weakest.name}
                    {" "}
                    ({weakest.value}/100)
                </p>
            </div>
            <small>{getAdvice()}</small>
        </div>
    );
}


export default PortfolioScoreCard;