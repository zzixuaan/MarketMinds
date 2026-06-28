import Card from "../General/Card";

/*function RecentTradesCard() {
    return (
        <Card>
            <h3>Recent Trades</h3>
            <p>(wtv recent trades here)</p>
        </Card>
    )
}

export default RecentTradesCard;
*/


export interface RecentTrades {
    id: string;
    date: string;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    total: number;
}

interface RecentTradesCardProps {
    entries: RecentTrades[];
    onViewAll?: () => void;
}

function RecentTradesCard({entries, onViewAll,}: RecentTradesCardProps ) {

    const validEntries = Array.isArray(entries)
        ? entries.filter((entry) => {
            const side = entry?.side?.toLowerCase();

             return (
                entry?.id &&
                entry?.symbol &&
                (side === "buy" || side === "sell") &&
                typeof entry?.price === "number" &&
                Number.isFinite(entry.price)
            );
        })
        : [];

    return (
        <section className= "journal-entries">
            <div className= "journal-entries-header">
                <h3>Recent Trades</h3>

                <button className= "view-all-button"
                onClick={onViewAll}
                >
                    View all
                </button>
            </div>

            {validEntries.length === 0 ? (
                <div className="journal-empty-state">
                    <p>No trade entries yet.</p>
                    <span> Make your first trade.</span>
                </div>
            ) : (
                <div className="journal-entries-list">
                    {validEntries.slice(0,3).map((entry) => {
                        //const isProfit = entry.pnl >= 0;

                        return (
                            <article 
                                className="journal-entry-row"
                                key={entry.id}
                            >
                                <div className="journal-entry-date">
                                     {new Date(entry.date).toLocaleDateString("en-GB", {day: "2-digit", month: "short",})}
                                </div>

                                <div className="journal-entry-info">
                                    <div className="journal-entry-title">
                                        <strong>{entry.symbol}</strong>
                                    </div>

                                    <div className="journal-entry-details">
                                        <span className={`journal-direction ${
                                            entry?.side?.toLowerCase() === "buy"
                                                                            ? "buy"
                                                                            : "sell"
                                                                        }`}
                                        > 
                                            {entry?.side ?? "Unknown"}
                                        </span>  

                                        <span>
                                            Entry ${entry?.price?.toFixed(2)}
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


export default RecentTradesCard;