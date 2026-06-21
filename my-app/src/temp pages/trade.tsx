import { useState, useEffect, useRef } from "react";
import { FaCircle } from "react-icons/fa";
import { createChart, LineSeries, CandlestickSeries } from "lightweight-charts";
import "../cssPages/trade.css";

export const Trade = () => {
    const [stockData, setStockData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [marketStatus, setMarketStatus] = useState<any>(null);
    const [marketIndices, setMarketIndices] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedStock, setSelectedStock] = useState<any>(null);

    const [chartData, setChartData] = useState<any>([]);

    //market status
    useEffect (() => {
        const fetchMarketStatus = async () => {
            try {
                const response = await fetch ("http://localhost:8000/api/market-status");
                const data = await response.json();
                setMarketStatus(data);
            } catch (err) {
                console.error(err);
            } 
        };
        fetchMarketStatus();
    }, []);

    useEffect (() => {
        const fetchMarketIndices = async () => {
            try {
                const response = await fetch ("http://localhost:8000/api/market-indices");
                const data = await response.json();
                setMarketIndices(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMarketIndices();
    }, []);


    // search
    useEffect(() => {
        const timer = setTimeout(() => {setDebouncedSearch(searchTerm);}, 250);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (selectedStock && selectedStock.symbol == searchTerm) {
            return;
        }

        const fetchSuggestions = async () => {
            if (debouncedSearch.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`http://localhost:8000/api/autocomplete/${debouncedSearch}`);
                const data = await response.json();
                setSuggestions(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSuggestions();
    }, [debouncedSearch, selectedStock, searchTerm]);

    const searchStock = async (symbol : string) => {
        if (!symbol.trim()) return;

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`http://localhost:8000/api/search/${symbol}`);
            if (!response.ok) {
                throw new Error("Stock not found");
            }

            const data = await response.json();
            setStockData(data);

            const chartResponse = await fetch(`http://localhost:8000/api/chart/${symbol}`);
            const chartJson = await chartResponse.json();   
            setChartData(chartJson);

        } catch (err) {
            setError("Unable to find stock.");
        } finally {
            setLoading(false);
        }
    };

    const selectStock = async (stock : any) => {
        setSelectedStock(stock);
        setSearchTerm(stock.symbol);
        setSuggestions([]);
        await searchStock(stock.symbol);
    }

    // chart
    const chartContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!chartContainerRef.current || chartData.length === 0) return;

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 450,
            layout: {
                background: {color: "#07152E"},
                textColor: "#94A3B8"
            },

            grid: {
                vertLines: {color: "#1E293B"},
                horzLines: {color: "#1E293B"}
            },

            rightPriceScale: {
                borderColor: "#1E293B",
            },

            timeScale: {
                borderColor: "#1E293B",
            },
        });

        const candlestickSeries = chart.addSeries(CandlestickSeries, {
            upColor: "#22C55E",
            downColor: "#EF4444",
            borderVisible: false,
            wickUpColor: "#22C55E",
            wickDownColor: "#EF4444",
        });

        candlestickSeries.setData(
            chartData.map((bar: any) => ({
                time: bar.timestamp.split("T")[0],
                open: bar.open,
                high: bar.high,
                low: bar.low,
                close: bar.close,
            }))
        );

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (!chartContainerRef.current) return;

            chart.applyOptions({
                width: chartContainerRef.current.clientWidth,
            });
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
            chart.remove();
        };

    }, [chartData]);

    return (
        <div className = "trade-page">
            <div className = "trade-container">
                <div className = "market-status-card">
                    <div>
                        <h3>
                            {FaCircle({
                                style: {
                                    color: marketStatus?.is_open ? "#22C55E" : "#EF4444",
                                    fontSize: "12px",
                                    marginRight: "8px"
                                }
                            })}
                            {marketStatus?.is_open 
                             ? "MARKET OPEN"
                             : "MARKET CLOSED" }
                        </h3>
                    </div>
                    <div>
                        {marketIndices && (
                            <>
                            <p>
                                SPY {marketIndices.SPY.change_percent.toFixed(2)}%
                            </p>
                            <p>
                                QQQ {marketIndices.QQQ.change_percent.toFixed(2)}%
                            </p>
                            <p>
                                DIA {marketIndices.DIA.change_percent.toFixed(2)}%
                            </p>
                            </>
                        )}
                    </div>
                </div>
                <div className = "search-card">
                    <div className = "search-bar">

                        <input className = "search-input"
                            type = "text"
                            placeholder = "Search ticker (e.g. AAPL, NVDA, TSLA...)"
                            value = {searchTerm}
                            onChange = {(e) => setSearchTerm(e.target.value)}
                        />

                        {suggestions.length > 0 && (
                            <div className = "search-dropdown">
                                {suggestions.map((stock) => (
                                    <div
                                        key = {stock.symbol}
                                        className = "dropdown-item"
                                        onClick = {() => selectStock(stock)}
                                    >
                                        <strong>{stock.symbol}</strong>
                                        <span>{stock.description}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className = "search-button"
                            onClick = {() => searchStock(searchTerm)}>
                            Search
                        </button>
                    </div>
                    {error && <p style = {{color: "red"}}>{error}</p>}
                </div>

                <div className = "result-container">
                    <div className = "company-card">
                        <div className = "company-header">
                            {loading && <p>Loading...</p>}
                            {error && <p>{error}</p>}

                            {stockData && (
                                <>
                                    <h2>{stockData.profile.name}</h2>
                                    <p>{stockData.profile.exchange}</p>
                                    <h1>${stockData.quote.c}</h1>
                                </>
                            )}
                        </div>
                        <div className = "chart-area">
                            <div ref={chartContainerRef}
                                style={{ width: "100%", height: "450px" }}
                            />
                        </div>
                    </div>
                    <div className = "trade-card">
                        <h2>Trade form here</h2>
                    </div>
                </div>
            </div>
        </div>
    );
};

