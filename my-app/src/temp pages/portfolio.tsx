import { useEffect, useRef, useState } from "react";
import { PieChart, Pie, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { auth } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";

import TopHeader from "../Components/General/TopHeader";
import Tooltip from "../Components/Portfolio/Tooltip";
import { TOOLTIPS } from "../services/tooltips"

import "../cssPages/portfolio.css";
import PortfolioSummaryCard from "../Components/Portfolio/PortfolioSummaryCard";

import { BASE_URL } from "../api";

interface Holding {
    symbol: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealisedPnl: number;
    pnlPercent: number;
    weight: number;
}

interface SectorAllocation {
    sector: string;
    value: number;
    percentage: number;
}

interface PortfolioData {
    cash: number;
    cashWeight: number;
    portfolioValue: number;
    startingCapital: number;
    totalReturn: number;
    totalReturnPercent: number;
    dailyChange: number;
    dailyChangePercent: number;
    marketValue: number;
    unrealisedPnl: number;
    unrealisedPnlPercent: number;
    holdings: Holding[];
    numberOfHoldings: number;
    bestHolding: Holding | null;
    worstHolding: Holding | null;
    roi: number;
    averagePosition: number;
    diversificationScore: number;
    riskLevel: string;
    largestPosition: Holding | null;
    sectorAllocation: SectorAllocation[];
}

interface HistoryPoint {
    value: number;
    timestamp: any;
}

export const Portfolio = () => {

    const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
    const [history, setHistory] = useState<HistoryPoint[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        const unsubscribe = onAuthStateChanged(auth, async (user) => {

            if (!user) {
                setError("Please sign in.");
                setLoading(false);
                return;
            }

            try {

                const token = await user.getIdToken();

                const [portfolioResponse, historyResponse] = await Promise.all([

                    fetch(`${BASE_URL}/api/portfolio`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch(`${BASE_URL}/api/portfolio/history`, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })

                ]);

                const portfolioData = await portfolioResponse.json();
                const historyData = await historyResponse.json();
                console.log("History data:", historyData);

                if (!portfolioResponse.ok)
                    throw new Error(portfolioData.detail);

                if (!historyResponse.ok)
                    throw new Error(historyData.detail);

                setPortfolio(portfolioData);
                setHistory(historyData);

            } catch (err: any) {
                setError(err.message);
                console.error("Portfolio error:", err);
            } finally {

                setLoading(false);

            }

        });

        return unsubscribe;

    }, []);

    if (loading) return (
        <div className="portfolio-page">
            <div className="portfolio-container">
                Loading portfolio...
                This may take a while, please be patient.
            </div>
        </div>
    )

    if (error) return <h2>{error}</h2>;

    if (!portfolio) return <h2>No portfolio found.</h2>;

    const COLORS = [
        "#6B7280", // Cash
        "#3B82F6",
        "#22C55E",
        "#F59E0B",
        "#EF4444",
        "#8B5CF6",
        "#14B8A6",
        "#EC4899",
    ];

    const allocationData = [
        {
            name: "Cash",
            value: portfolio.cash,
            fill: COLORS[0],
        },
        ...portfolio.holdings.map((h, index) => ({
            name: h.symbol,
            value: h.marketValue,
            fill: COLORS[(index + 1) % COLORS.length],
        })),
    ];

    
    return (
        <div className = "portfolio-page">
            <TopHeader />
            <div className = "portfolio-container">
                <h1>Portfolio</h1>
                <div className = "portfolio-summary">
                    <div className = "summary-card">
                        <div className="card-title">
                            <h3>Portfolio Value</h3>
                            <Tooltip text={TOOLTIPS.portfolioValue} />
                        </div>
                        <p>${portfolio.portfolioValue.toLocaleString()}</p>
                    </div>
                    <div className = "summary-card">
                        <div className="card-title">
                            <h3>Market Value</h3>
                            <Tooltip text={TOOLTIPS.marketValue} />
                        </div>
                        <p>${portfolio.marketValue.toLocaleString()}</p>
                    </div>
                    <div className = "summary-card">
                        <div className="card-title">
                            <h3>Cash</h3>
                            <Tooltip text={TOOLTIPS.cash} />
                        </div>
                        <p>${portfolio.cash.toLocaleString()}</p>
                        <small>{portfolio.cashWeight}% of portfolio</small>
                    </div>
                    <div className = "summary-card">
                        <div className="card-title">
                            <h3>Unrealised P/L</h3>
                            <Tooltip text={TOOLTIPS.totalPnl} />
                        </div>
                        <p
                            style={{
                                color: portfolio.unrealisedPnl >= 0 ? "#22C55E" : "#EF4444",
                            }}
                        >
                            ${portfolio.unrealisedPnl.toLocaleString()}
                            <br />
                            {portfolio.unrealisedPnlPercent.toFixed(2)}%
                        </p>
                    </div>
                    <div className = "performance-row">
                        <div className = "summary-card performance-card">
                            <div className="card-title">
                                <h3>Total Return</h3>
                                <Tooltip text={TOOLTIPS.totalReturn} />
                            </div>
                            <div
                                className = "total-return-value"
                                style={{
                                    color: portfolio.totalReturn >= 0
                                        ? "#22C55E"
                                        : "#EF4444",
                                }}
                            >
                                <strong>
                                    {portfolio.totalReturn >= 0 ? "+" : ""}
                                    ${portfolio.totalReturn.toLocaleString()}
                                </strong>

                                <span>
                                    {portfolio.totalReturnPercent >= 0 ? "+" : ""}
                                    {portfolio.totalReturnPercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                        <div className = "summary-card performance-card">
                            <div className="card-title">
                                <h3>Daily Change</h3>
                                <Tooltip text={TOOLTIPS.dailyChange} />
                            </div>
                            <div
                                className = "total-return-value"
                                style={{
                                    color: portfolio.dailyChange >= 0
                                        ? "#22C55E"
                                        : "#EF4444",
                                }}
                            >
                                <strong>
                                    {portfolio.dailyChange >= 0 ? "+" : ""}
                                    ${Math.abs(portfolio.dailyChange).toLocaleString()}
                                </strong>

                                <span>
                                    {portfolio.dailyChangePercent >= 0 ? "+" : ""}
                                    {portfolio.dailyChangePercent.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <PortfolioSummaryCard
                    portfolio={{
                        portfolioValue: portfolio.portfolioValue,
                        totalReturn: portfolio.totalReturn,
                        totalReturnPercent: portfolio.totalReturnPercent,
                    }}
                    history={history}
                />
                <div className = "portfolio-dashboard">
                    <div className = "dashboard-left">
                        <div className = "allocation">
                            <div className="card-title">
                                <h2>Allocation</h2>
                                <Tooltip text={TOOLTIPS.allocationDonut} />
                            </div>
                            <div className = "allocation-chart">
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={105}
                                            paddingAngle={2}
                                            fill="#3B82F6"
                                        />
                                        <RechartsTooltip
                                            formatter={(value) => [
                                                `$${Number(value).toLocaleString()}`,
                                                "Value",
                                            ]}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className = "sector-card">
                            <div className="card-title">
                                <h2>Sector Allocation</h2>
                                <Tooltip text={TOOLTIPS.allocationSector} />
                            </div>
                            {portfolio.sectorAllocation.map((sector) => (
                                <div className = "sector-row" key={sector.sector}>
                                    <div className = "sector-header">
                                        <span>{sector.sector}</span>
                                        <span>{sector.percentage.toFixed(1)}%</span>
                                    </div>
                                    <div className = "sector-bar">
                                        <div
                                            className ="sector-fill"
                                            style={{
                                                width: `${sector.percentage}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className = "dashboard-right">
                        <div className = "score-card">
                            <div className="card-title">
                                <h2>Portfolio Score</h2>
                                <Tooltip text={TOOLTIPS.portfolioScore} />
                            </div>
                        </div>
                        <div className = "insights">
                            <h2>Portfolio Analytics</h2>
                            <div className = "analytics-grid">
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>ROI</span>
                                        <Tooltip text={TOOLTIPS.roi} />
                                    </div>
                                    <strong
                                        style={{
                                            color: portfolio.roi >= 0 ? "#22C55E" : "#EF4444",
                                        }}
                                    >
                                        {portfolio.roi.toFixed(2)}%
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Risk Level</span>
                                        <Tooltip text={TOOLTIPS.riskLevel} />
                                    </div>
                                    <strong
                                        style={{
                                            color:
                                                portfolio.riskLevel === "Low"
                                                    ? "#22C55E"
                                                    : portfolio.riskLevel === "Medium"
                                                    ? "#F59E0B"
                                                    : "#EF4444",
                                        }}
                                    >
                                        {portfolio.riskLevel}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Diversification</span>
                                        <Tooltip text={TOOLTIPS.diversification} />
                                    </div>
                                    <strong>{portfolio.diversificationScore}/100</strong>
                                    <div className = "score-bar">
                                        <div
                                            className = "score-fill"
                                            style={{
                                                width: `${portfolio.diversificationScore}%`
                                            }}
                                        />
                                    </div>
                                    <small>
                                        {portfolio.diversificationScore >= 80
                                            ? "Excellent"
                                            : portfolio.diversificationScore >= 60
                                            ? "Good"
                                            : "Concentrated"}
                                    </small>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Holdings</span>
                                        <Tooltip text={TOOLTIPS.holdings} />
                                    </div>
                                    <strong>{portfolio.numberOfHoldings}</strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Largest Position</span>
                                        <Tooltip text={TOOLTIPS.largestPosition} />
                                    </div>
                                    <strong>
                                        {portfolio.largestPosition
                                            ? `${portfolio.largestPosition.symbol} (${portfolio.largestPosition.weight.toFixed(1)}%)`
                                            : "-"}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Average Position</span>
                                        <Tooltip text={TOOLTIPS.averagePosition} />
                                    </div>
                                    <strong>
                                        ${portfolio.averagePosition.toLocaleString()}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Best Performer</span>
                                        <Tooltip text={TOOLTIPS.bestPerformer} />
                                    </div>
                                    <strong
                                        style={{ color: "#22C55E" }}
                                    >
                                        {portfolio.bestHolding
                                            ? `${portfolio.bestHolding.symbol} (+${portfolio.bestHolding.pnlPercent.toFixed(2)}%)`
                                            : "-"}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <div className="card-title">
                                        <span>Worst Performer</span>
                                        <Tooltip text={TOOLTIPS.worstPerformer} />
                                    </div>
                                    <strong
                                        style={{ color: "#EF4444" }}
                                    >
                                        {portfolio.worstHolding
                                            ? `${portfolio.worstHolding.symbol} (${portfolio.worstHolding.pnlPercent.toFixed(2)}%)`
                                            : "-"}
                                    </strong>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                <h2>Current Holdings ({portfolio.numberOfHoldings})</h2>
                <div className = "portfolio-table-wrapper">
                    <table className = "portfolio-table">
                        <thead>
                            <tr>
                                <th>Symbol</th>
                                <th>Qty</th>
                                <th>Weight</th>
                                <th>Avg Cost</th>
                                <th>Current</th>
                                <th>Value</th>
                                <th>P/L</th>
                            </tr>
                        </thead>
                        <tbody>
                            {portfolio.holdings.map(h => (
                                <tr key={h.symbol}>
                                    <td>{h.symbol}</td>
                                    <td>{h.quantity}</td>
                                    <td>
                                        <div className="weight-cell">
                                            <div className="weight-bar">
                                                <div
                                                    className="weight-fill"
                                                    style={{ width: `${h.weight}%` }}
                                                />
                                            </div>
                                            <span>{h.weight.toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td>${h.averageCost.toLocaleString()}</td>
                                    <td>${h.currentPrice.toLocaleString()}</td>
                                    <td>${h.marketValue.toLocaleString()}</td>
                                    <td
                                        className={
                                            h.unrealisedPnl >= 0
                                                ? "positive"
                                                : "negative"
                                        }
                                    >
                                        {h.unrealisedPnl >= 0 ? "+" : ""}
                                        ${h.unrealisedPnl.toLocaleString()}
                                        <br />
                                        {h.pnlPercent >= 0 ? "+" : ""}
                                        {h.pnlPercent.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};