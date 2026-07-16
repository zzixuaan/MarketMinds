import "../../cssComponents/PortfolioSummaryCard.css";

import { useEffect, useRef, useState } from "react";
import {
    createChart,
    ColorType,
    AreaSeries,
    IChartApi,
} from "lightweight-charts";

interface HistoryPoint {
    value: number;
    timestamp: string;
}

interface PortfolioData {
    portfolioValue: number;
    totalReturn: number;
    totalReturnPercent: number;
}

interface Props {
    portfolio: PortfolioData;
    history: HistoryPoint[];
}

function PortfolioSummaryCard({
    portfolio,
    history,
}: Props) {

    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<IChartApi | null>(null);

    const [selectedRange, setSelectedRange] = useState("ALL");

    useEffect(() => {

        if (!chartRef.current) return;
        if (history.length === 0) return;

        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: chartRef.current.clientHeight,

            layout: {
                background: {
                    type: ColorType.Solid,
                    color: "#0F172A",
                },
                textColor: "#CBD5E1",
            },

            grid: {
                vertLines: {
                    color: "rgba(255,255,255,0.05)",
                },
                horzLines: {
                    color: "rgba(255,255,255,0.05)",
                },
            },
        });

        chartInstance.current = chart;

        const area = chart.addSeries(AreaSeries, {
            lineColor: "#22C55E",
            topColor: "rgba(34,197,94,0.4)",
            bottomColor: "rgba(34,197,94,0.05)",
        });

        const chartData = history
            .map((h) => ({
                time: Math.floor(
                    new Date(h.timestamp).getTime() / 1000
                ),
                value: h.value,
            }))
            .sort((a, b) => a.time - b.time)
            .filter(
                (point, index, array) =>
                    index === 0 ||
                    point.time !== array[index - 1].time
            );

        area.setData(chartData as any);

        chart.timeScale().fitContent();

        const resize = () => {
            if (!chartRef.current) return;

            chart.applyOptions({
                width: chartRef.current.clientWidth,
                height: chartRef.current.clientHeight
            });
        };

        window.addEventListener("resize", resize);

        return () => {
            window.removeEventListener("resize", resize);
            chart.remove();
        };

    }, [history]);

    const changeChartRange = (range: string) => {

        setSelectedRange(range);

        const chart = chartInstance.current;
        if (!chart) return;

        if (range === "ALL") {
            chart.timeScale().fitContent();
            return;
        }

        const latestTime = Math.floor(
            new Date(
                history[history.length - 1].timestamp
            ).getTime() / 1000
        );

        let seconds = 0;

        switch (range) {
            case "1D":
                seconds = 86400;
                break;
            case "1W":
                seconds = 604800;
                break;
            case "1M":
                seconds = 2592000;
                break;
            case "1Y":
                seconds = 31536000;
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
        <div className="portfolio-summary-card">
            <div className="portfolio-summary-header">
                <div className="portfolio-summary-title">
                    <h2>Portfolio Performance</h2>
                    <p
                        style={{
                            color:
                                portfolio.totalReturn >= 0
                                    ? "#22C55E"
                                    : "#EF4444",
                        }}
                    >
                        {portfolio.totalReturn >= 0 ? "+" : ""}
                        ${portfolio.totalReturn.toLocaleString()} (
                        {portfolio.totalReturnPercent >= 0 ? "+" : ""}
                        {portfolio.totalReturnPercent.toFixed(2)}%)
                    </p>
                </div>
                <div className="portfolio-time-buttons">
                    <button
                        className={selectedRange === "1D" ? "active" : ""}
                        onClick={() => changeChartRange("1D")}
                    >
                        1D
                    </button>
                    <button
                        className={selectedRange === "1W" ? "active" : ""}
                        onClick={() => changeChartRange("1W")}
                    >
                        1W
                    </button>
                    <button
                        className={selectedRange === "1M" ? "active" : ""}
                        onClick={() => changeChartRange("1M")}
                    >
                        1M
                    </button>
                    <button
                        className={selectedRange === "1Y" ? "active" : ""}
                        onClick={() => changeChartRange("1Y")}
                    >
                        1Y
                    </button>
                    <button
                        className={selectedRange === "ALL" ? "active" : ""}
                        onClick={() => changeChartRange("ALL")}
                    >
                        ALL
                    </button>
                </div>
            </div>
            <div
                ref={chartRef}
                className="portfolio-chart-container"
            />
        </div>
    );
}

export default PortfolioSummaryCard;