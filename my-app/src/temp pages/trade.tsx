import { useState, useEffect, useRef } from "react";
import { FaCircle } from "react-icons/fa";
import { createChart, LineSeries, CandlestickSeries } from "lightweight-charts";
import { auth } from "../firebase-config";
import "../cssPages/trade.css";
import TopHeader from "../Components/General/TopHeader"

import { BASE_URL } from "../api";

export const Trade = () => {
    const [stockData, setStockData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [marketStatus, setMarketStatus] = useState<any>(null);
    const [marketIndices, setMarketIndices] = useState<any>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);

    const [chartData, setChartData] = useState<any>([]);

    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [quantity, setQuantity] = useState("");
    const [showReview, setShowReview] = useState(false);

    //market status
    useEffect (() => {
        const fetchMarketStatus = async () => {
            try {
                const response = await fetch (`${BASE_URL}/api/market-status`);
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
                const response = await fetch (`${BASE_URL}/api/market-indices`);
                const data = await response.json();
                setMarketIndices(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMarketIndices();
    }, []);


    // search
    const dropdownRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const timer = setTimeout(() => {setDebouncedSearch(searchTerm);}, 200);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (stockData && stockData.symbol == searchTerm.toUpperCase()) {
            return;
        }

        const fetchSuggestions = async () => {
            if (debouncedSearch.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const response = await fetch(`${BASE_URL}/api/autocomplete/${debouncedSearch}`);
                const data = await response.json();
                setSuggestions(data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchSuggestions();
    }, [debouncedSearch, searchTerm, stockData]);

    useEffect(() => {
        const handleClickOutside = (event : MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {document.removeEventListener("mousedown", handleClickOutside);};
    }, []);

    const searchStock = async (symbol : string) => {
        if (!symbol.trim()) return;

        try {
            setLoading(true);
            setError("");

            const response = await fetch(`${BASE_URL}/api/search/${symbol}`);
            if (!response.ok) {
                throw new Error("Stock not found");
            }

            const data = await response.json();
            setStockData(data);

            const chartResponse = await fetch(`${BASE_URL}/api/chart/${symbol}`);
            const chartJson = await chartResponse.json();   
            setChartData(chartJson);

        } catch (err) {
            setError("Unable to find stock.");
        } finally {
            setLoading(false);
        }
    };

    const selectStock = async (stock : any) => {
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

    //trade
    const submitTrade = async () => {
        try {
            const token = await auth.currentUser!.getIdToken();
            const response = await fetch(`${BASE_URL}/api/trade`, 
                                         { method: "POST", 
                                           headers: {"Content-Type" : "application/json",
                                                     "Authorization" : `Bearer ${token}`
                                                    },
                                           body: JSON.stringify({ symbol: stockData.symbol, 
                                                                  side, 
                                                                  quantity: Number(quantity), 
                                                                  price: stockData.quote.c})
                                         }
                                    );
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail);
            }
            alert("Trade submitted successfully!");
            setShowReview(false);
        } catch (err : any) {
            alert(err.message || "Trade failed.");
        };
    };
    

    return (
        <div className = "trade-page">
            <TopHeader />
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
                    <div className = "search-bar"
                        ref = {dropdownRef}>
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
            {stockData ? (
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
                        <div className = "trade-form">
                            <h2>TRADE</h2>
                            <div className = "form-section">
                                <label>Symbol</label>
                                <input value = {stockData?.symbol || ""}
                                    readOnly
                                />
                            </div>
                            <div className = "form-section">
                                <label>Order type</label>
                                <div className = "trade-toggle">
                                    <button type = "button"
                                        className = {`toggle-button ${side === "buy" ? "active-buy" : ""}`}
                                        onClick = {() => setSide("buy")}
                                    >Buy</button>
                                    <button type = "button"
                                        className = {`toggle-button ${side === "sell" ? "active-sell" : ""}`}
                                        onClick = {() => setSide("sell")}
                                    >Sell</button>
                                </div>
                            </div>
                            <div className = "form-section">
                                <label>Quantity</label>
                                <input type = "number"
                                    min = "1"
                                    placeholder = "Shares"
                                    value = {quantity}
                                    onChange = {(e) => setQuantity(e.target.value)}
                                />
                            </div>
                            <p>Current price: ${stockData?.quote?.c?.toFixed(2) || "0.00"}</p>
                            <p>Estimated value: ${(Number(quantity || 0) * (stockData?.quote?.c || 0)).toFixed(2)}</p>
                            <button className = "review-button"
                                disabled = {!quantity || Number(quantity) <= 0}
                                onClick = {() => setShowReview(true)}>
                                    Review Trade
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className = "empty-state">
                    Search for a stock to begin trading
                </div>
            ) }
            </div>
            {showReview && (
                <div className = "modal-overlay">
                    <div className = "review-modal">
                        <div className="review-details">
                            <div className="review-row">
                                <span className="review-label">Side</span>
                                <span className="review-value">{side.toUpperCase()}</span>
                            </div>

                            <div className="review-row">
                                <span className="review-label">Symbol</span>
                                <span className="review-value">{stockData?.symbol}</span>
                            </div>

                            <div className="review-row">
                                <span className="review-label">Quantity</span>
                                <span className="review-value">{quantity}</span>
                            </div>

                            <div className="review-row">
                                <span className="review-label">Price</span>
                                <span className="review-value">
                                    ${stockData?.quote?.c?.toFixed(2)}
                                </span>
                            </div>

                            <div className="review-row review-total">
                                <span>Estimated Total</span>
                                <span>
                                    ${(Number(quantity) * stockData?.quote?.c).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="review-actions">
                            <button
                                className="cancel-button"
                                onClick={ () => setShowReview(false)}
                            >
                                Cancel
                            </button>

                            <button
                                className="confirm-button"
                                onClick = {() => submitTrade()}
                            >
                                Confirm Trade
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

