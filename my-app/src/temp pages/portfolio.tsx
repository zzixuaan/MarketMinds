import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { auth } from "../firebase-config";
import { onAuthStateChanged } from "firebase/auth";

import TopHeader from "../Components/General/TopHeader";

import "../cssPages/portfolio.css";

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

interface PortfolioData {
    cash: number;
    cashWeight: number;

    portfolioValue: number;
    marketValue: number;

    unrealisedPnl: number;
    unrealisedPnlPercent: number;

    holdings: Holding[];

    numberOfHoldings: number;

    bestHolding: Holding | null;
    worstHolding: Holding | null;
}

interface HistoryPoint {
    value: number;
    timestamp: any;
}

export const Portfolio = () => {

    const chartRef = useRef<HTMLDivElement>(null);

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

                    fetch("https://marketminds-i17q.onrender.com/api/portfolio", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }),

                    fetch("https://marketminds-i17q.onrender.com/api/portfolio/history", {
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

        const area = chart.addSeries(AreaSeries, {
            lineColor: "#22C55E",
            topColor: "rgba(34,197,94,0.4)",
            bottomColor: "rgba(34,197,94,0.05)"
        });

        area.setData(

            history.map(h => ({
                time: Math.floor(new Date(h.timestamp).getTime() / 1000) as any,
                value: h.value
            }))
        );

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
                        <h3>Cash</h3>
                        <p>${portfolio.cash.toLocaleString()}</p>
                        <small>{portfolio.cashWeight}%</small>
                    </div>
                    <div className = "summary-card">
                        <h3>Market Value</h3>
                        <p>${portfolio.marketValue.toLocaleString()}</p>
                    </div>
                    <div className = "summary-card">
                        <h3>Total P/L</h3>
                        <p
                            style={{
                                color:
                                    portfolio.unrealisedPnl >= 0
                                        ? "#22C55E"
                                        : "#EF4444"
                            }}
                        >
                            ${portfolio.unrealisedPnl.toLocaleString()}
                            <br />
                            {portfolio.unrealisedPnlPercent}%
                        </p>
                    </div>
                </div>
                <div className = "portfolio-chart">
                    <h2>Portfolio Performance</h2>
                    <div
                        ref={chartRef}
                        style={{
                            width: "100%",
                            height: "320px"
                        }}
                    />
                </div>
                <div className = "portfolio-bottom">
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
                    <div className = "insights">
                        <h2>Portfolio Insights</h2>
                        <p>
                            <strong>Best Performer</strong>
                            <br />
                            {portfolio.bestHolding
                                ? `${portfolio.bestHolding.symbol} (${portfolio.bestHolding.pnlPercent}%)`
                                : "-"}
                        </p>
                        <p>
                            <strong>Worst Performer</strong>
                            <br />
                            {portfolio.worstHolding
                                ? `${portfolio.worstHolding.symbol} (${portfolio.worstHolding.pnlPercent}%)`
                                : "-"}
                        </p>
                        <p>
                            <strong>Holdings</strong>
                            <br />
                            {portfolio.numberOfHoldings}
                        </p>
                    </div>
                </div>
                <h2>Current Holdings</h2>
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
                                        style={{
                                            color:
                                                h.unrealisedPnl >= 0
                                                    ? "#22C55E"
                                                    : "#EF4444"
                                        }}
                                    >
                                        ${h.unrealisedPnl.toLocaleString()}
                                        <br />
                                        {h.pnlPercent}%
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