import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { auth } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";

import TopHeader from "../Components/General/TopHeader";

import "../cssPages/portfolio.css";

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

    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const [selectedRange, setSelectedRange] = useState("ALL");

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

    useEffect(() => {

        if (!chartRef.current) return;
        if (history.length === 0) return;

        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: 320,
            layout: {
                background: {
                    type: ColorType.Solid,
                    color: "#0F172A"
                },
                textColor: "#CBD5E1"
            },

            grid: {
                vertLines: { color: "#rgba(255,255,255,0.05)" },
                horzLines: { color: "#rgba(255,255,255,0.05)" }
            }
        });
        chartInstance.current = chart;

        const area = chart.addSeries(AreaSeries, {
            lineColor: "#22C55E",
            topColor: "rgba(34,197,94,0.4)",
            bottomColor: "rgba(34,197,94,0.05)"
        });

        const chartData = history
            .map(h => ({
                time: Math.floor(new Date(h.timestamp).getTime() / 1000),
                value: h.value,
            }))
            .sort((a, b) => a.time - b.time)
            .filter((point, index, array) =>
                index === 0 || point.time !== array[index - 1].time
            );

        area.setData(chartData as any);
        chart.timeScale().fitContent();

        const resize = () => {
            chart.applyOptions({
                width: chartRef.current!.clientWidth
            });
        };

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            chart.remove();
        };

    }, [history]);

    if (loading) return (
        <div className="portfolio-page">
            <div className="portfolio-container">
                Loading portfolio...
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

    // adjust chart
    const changeChartRange = (range:string) => {
        setSelectedRange(range);

        const chart = chartInstance.current;
        if (!chart) return;

        if (range === "ALL") {
            chart.timeScale().fitContent();
            return;
        }

        const latestTime = Math.floor(new Date(history[history.length - 1].timestamp).getTime() / 1000);        
        let seconds;

        switch(range){
            case "1D":
                seconds = 24 * 60 * 60;
                break;
            case "1W":
                seconds = 7 * 24 * 60 * 60;
                break;
            case "1M":
                seconds = 30 * 24 * 60 * 60;
                break;
            case "1Y":
                seconds = 365 * 24 * 60 * 60;
                break;
            default:
                return;
        }

        chart.timeScale().setVisibleRange({
            from: (latestTime - seconds) as any,
            to: latestTime as any,
        });
    };

    return (
        <div className = "portfolio-page">
            <TopHeader />
            <div className = "portfolio-container">
                <h1>Portfolio</h1>
                <div className = "portfolio-summary">
                    <div className = "summary-card">
                        <h3>Portfolio Value</h3>
                        <p>${portfolio.portfolioValue.toLocaleString()}</p>
                    </div>
                    <div className = "summary-card">
                        <h3>Market Value</h3>
                        <p>${portfolio.marketValue.toLocaleString()}</p>
                    </div>
                    <div className = "summary-card">
                        <h3>Cash</h3>
                        <p>${portfolio.cash.toLocaleString()}</p>
                        <small>{portfolio.cashWeight}% of portfolio</small>
                    </div>
                    <div className = "summary-card">
                        <h3>Total P/L</h3>
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
                            <h3>Total Return</h3>
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
                            <h3>Daily Change</h3>

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
                <div className = "portfolio-chart">
                    <div className = "chart-header">
                        <h2>Portfolio Performance</h2>
                        <div className = "chart-buttons">
                            <button
                                className={selectedRange === "1D" ? "active" : ""}
                                onClick={() => changeChartRange("1D")}
                            >1D</button>                            
                            <button
                                className={selectedRange === "1W" ? "active" : ""}
                                onClick={() => changeChartRange("1W")}
                            >1W</button>
                            <button
                                className={selectedRange === "1M" ? "active" : ""}
                                onClick={() => changeChartRange("1M")}
                            >1M</button>                            
                            <button
                                className={selectedRange === "1Y" ? "active" : ""}
                                onClick={() => changeChartRange("1Y")}
                            >1Y</button>                            
                            <button
                                className={selectedRange === "ALL" ? "active" : ""}
                                onClick={() => changeChartRange("ALL")}
                            >ALL</button>
                        </div>
                    </div>
                    <div
                        ref={chartRef}
                        style={{
                            width: "100%",
                            height: "320px",
                        }}
                    />
                </div>
                <div className = "portfolio-dashboard">
                    <div className = "dashboard-left">
                        <div className = "allocation">
                            <h2>Allocation</h2>
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
                                        <Tooltip
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
                            <h2>Sector Allocation</h2>
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
                            <h2>Portfolio score</h2>
                        </div>
                        <div className = "insights">
                            <h2>Portfolio Analytics</h2>
                            <div className = "analytics-grid">
                                <div className = "analytics-item">
                                    <span>ROI</span>
                                    <strong
                                        style={{
                                            color: portfolio.roi >= 0 ? "#22C55E" : "#EF4444",
                                        }}
                                    >
                                        {portfolio.roi.toFixed(2)}%
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <span>Risk Level</span>
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
                                    <span>Diversification</span>
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
                                    <span>Holdings</span>
                                    <strong>{portfolio.numberOfHoldings}</strong>
                                </div>
                                <div className = "analytics-item">
                                    <span>Largest Position</span>
                                    <strong>
                                        {portfolio.largestPosition
                                            ? `${portfolio.largestPosition.symbol} (${portfolio.largestPosition.weight.toFixed(1)}%)`
                                            : "-"}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <span>Average Position</span>
                                    <strong>
                                        ${portfolio.averagePosition.toLocaleString()}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <span>Best Performer</span>
                                    <strong
                                        style={{ color: "#22C55E" }}
                                    >
                                        {portfolio.bestHolding
                                            ? `${portfolio.bestHolding.symbol} (+${portfolio.bestHolding.pnlPercent.toFixed(2)}%)`
                                            : "-"}
                                    </strong>
                                </div>
                                <div className = "analytics-item">
                                    <span>Worst Performer</span>
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