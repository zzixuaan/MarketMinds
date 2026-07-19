import TopHeader from "../Components/General/TopHeader";
import PortfolioSummaryCard from "../Components/Portfolio/PortfolioSummaryCard";
import KeyMetricsCard from "../Components/Home/KeyMetricsCard";
import TopHoldingsCard from "../Components/Home/TopHoldingsCard";
import RecentTradesCard from "../Components/Home/RecentTradesCard";
import HomeHeader from "../Components/Home/HomeHeader";
import DailyMessageCard from "../Components/Home/DailyMessageCard";

import { getMarketNews } from "../services/marketApi";
import "../cssPages/HomePage.css";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
  getTradeEntries,
} from "../services/tradeApi";

import type {
  TradeEntry,
} from "../services/tradeApi";

import { getPortfolio } from "../services/portfolioApi";


interface NewsArticle {
    headline: string,
    summary: string,
    source: string,
    image: string,
    url: string,
    datetime: number;
}

function HomePage() {

    const navigate = useNavigate();

    const [username, setUsername] = useState<string>("");

    const [entries, setEntries] = useState<TradeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const [portfolio, setPortfolio] = useState<any>(null);
    const [history, setHistory] = useState<{
            value: number;
            timestamp: string;
        }[]>([]);

    const [marketNews, setMarketNews] = useState<NewsArticle[]>([])
    const [loadingNews, setLoadingNews] = useState(true);
    
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setError("Please log in to view your trades.");
                    setIsLoading(false);
                    return;
                }
                setUsername(
                    user.displayName ||
                    "Trader"
                );

                try {
                    setError("");

                    const tradeEntries = await getTradeEntries();
                    setEntries(tradeEntries);

                    const data = await getPortfolio();
                    setPortfolio(data.portfolio);
                    setHistory(data.history);


                } catch (error) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load trade entries."
                    );

                } finally {
                    setIsLoading(false);
                }
            }
        );
        return unsubscribe;
    }, []);

     const recentEntries = entries.map((entry) => ({
        id: entry.id,
        date: entry.createdAt || new Date().toISOString(),
        symbol: entry.symbol,
        side: entry.side,
        price: entry.price,
        total: entry.total,
        quantity: entry.quantity,
    }));

    useEffect(() => {
        const fetchMarketNews = async () => {
            try {
                const data = await getMarketNews();
                setMarketNews(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingNews(false);
            }
        };
        fetchMarketNews();
    }, []);

    const todayTrades = entries.filter((entry) => {
        const tradeDate = new Date(entry.createdAt || "");
        const today = new Date();

        return (
            tradeDate.getDate() === today.getDate() &&
            tradeDate.getMonth() === today.getMonth() &&
            tradeDate.getFullYear() === today.getFullYear()
        );
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!portfolio) {
        return <div>Loading portfolio...</div>;
    }

    return (
        <div className= "home">
            <TopHeader />
            <div className = "home-dashboard">
                <div className = "left-column">
                    <DailyMessageCard 
                        username = {username}
                        dailyChange = {portfolio.dailyChangePercent}
                        tradeCount = {todayTrades.length}
                    />
                    <div className = "home-portfolio">
                        <div className = "home-portfolio-wrapper">
                            <PortfolioSummaryCard
                                portfolio={portfolio}
                                history={history}
                            />
                        </div>
                    </div>
                </div>
                <div className = "right-column">
                    <TopHoldingsCard />
                    <RecentTradesCard
                    entries={recentEntries}
                    onViewAll={() => navigate("/recent-trades")}
                    />
                </div>
            </div>
            <div className="home-news-section">
                <h2>Latest headlines for today's markets</h2>
                {loadingNews ? (
                    <p>Loading news...</p>
                    ) : (
                    <div className="news-list">
                        {marketNews.slice(0, 4).map((article, index) => (
                            <div
                                key={index}
                                className="news-card"
                                onClick={() => window.open(article.url, "_blank", "noopener,noreferrer")}
                            >
                                {article.image && (
                                    <img
                                        src={article.image}
                                        alt={article.headline}
                                        className="news-image"
                                    />
                                )}
                                <div className="news-content">
                                    <h3>{article.headline || "Untitled Article"}</h3>
                                    <p>
                                        {article.summary.length > 140
                                            ? article.summary.substring(0, 70) + "..."
                                            : article.summary || "Click to read the full article."}
                                    </p>
                                    <span>
                                        {article.source} •{" "}
                                        {new Date(article.datetime * 1000).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="news-footer">
                    <button
                        className="view-more-news-button"
                        onClick={() => alert("News page coming soon!")}
                    >
                        View More News →
                    </button>
                </div>
            </div>
        </div>
    )
}

export default HomePage