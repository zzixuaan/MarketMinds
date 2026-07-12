import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTradeEntries } from "../services/tradeApi";
import type { TradeEntry } from "../services/tradeApi";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";
import "../cssPages/RecentTradesPage.css";
import TopHeader from "../Components/General/TopHeader";


export interface RecentTrades {
    id: string;
    date: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    total: number;
}

interface RecentTradesPageProps {
    onViewAll?: () => void;
}

function RecentTradesPage({onViewAll,}: RecentTradesPageProps ) {
    const navigate = useNavigate();
    const [tradeEntries, setTradeEntries] = useState<TradeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setError("Please log in to view your trades.");
                    setIsLoading(false);
                    return;
                }

                try {
                    setError("");

                    const fetchedEntries = await getTradeEntries();
                    setTradeEntries(Array.isArray(fetchedEntries) ? fetchedEntries : []);

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

     const recentEntries: RecentTrades[] = tradeEntries.map((entry) => ({
        id: entry.id,
        date: entry.createdAt || new Date().toISOString(),
        symbol: entry.symbol,
        side: entry.side,
        price: entry.price,
        total: entry.total,
        quantity: entry.quantity,
    }));

    const validEntries: RecentTrades[] = recentEntries.filter((entry) => { 
            const side = entry?.side?.toLowerCase();

             return (
                entry?.id &&
                entry?.symbol &&
                (side === "buy" || side === "sell") &&
                typeof entry?.price === "number" &&
                Number.isFinite(entry.price)
            );
        });

    return (
        <section className= "trade-entries">
            <TopHeader />
            <div className= "trade-entries-header">
                <h3>Recent Trades</h3>
            </div>

            {validEntries.length === 0 ? (
                <div className="trade-empty-state">
                    <p>No trade entries yet.</p>
                    <span> Make your first trade.</span>
                </div>
            ) : (
                <div className="trade-entries-list">
                    {validEntries.map((entry) => {
                        //const isProfit = entry.pnl >= 0;

                        return (
                            <article 
                                className="trade-entry-row"
                                key={entry.id}
                            >
                                <div className="trade-entry-date">
                                    {new Date(entry.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short",})}
                                </div>

                                <div className="trade-entry-info">
                                    <div className="trade-entry-title">
                                        <strong>{entry.symbol}</strong>
                                    </div>

                                    <div className="trade-entry-details">
                                        <span className={`trade-direction ${
                                            entry?.side?.toLowerCase() === "buy"
                                                                            ? "buy"
                                                                            : "sell"
                                                                        }`}
                                        > 
                                            {entry?.side ?? "Unknown"}
                                        </span>  

                                        <span>
                                            Entry: ${entry?.price?.toFixed(2)}
                                        </span>


                                         <span>
                                            Quantity: {entry?.quantity}
                                        </span>
                                    </div>


                                </div>
                            
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}


export default RecentTradesPage;