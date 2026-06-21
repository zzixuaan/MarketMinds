import "../../cssComponents/JournalEntriesCard.css"

export interface RecentJournalEntry {
    id: string;
    date: string;
    ticker: string;
    company: string;
    direction: string;
    entryPrice: number;
    pnl: number;
}

interface JournalEntriesCardProps {
    entries: RecentJournalEntry[];
    onViewAll?: () => void;
}

function JournalEntriesCard({entries, onViewAll,}: JournalEntriesCardProps ) {
    return (
        <section className= "journal-entries">
            <div className= "journal-entries-header">
                <h3>Recent Journal Entries</h3>

                <button className= "view-all-button"
                onClick={onViewAll}
                >
                    View all
                </button>
            </div>

            {entries.length === 0 ? (
                <div className="journal-empty-state">
                    <p>No journal entries yet.</p>
                    <span> Make your first trade and create your first entry</span>
                </div>
            ) : (
                <div className="journal-entries-list">
                    {entries.slice(0,3).map((entry) => {
                        const isProfit = entry.pnl >= 0;

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
                                        <strong>{entry.ticker}</strong>
                                        <span>{entry.company}</span>
                                    </div>

                                    <div className="journal-entry-details">
                                        <span className={`journal-direction ${
                                            entry.direction.toLowerCase() === "buy"
                                                                            ? "buy"
                                                                            : "sell"
                                                                        }`}
                                        > 
                                            {entry.direction}
                                        </span>  

                                        <span>
                                            Entry ${entry.entryPrice.toFixed(2)}
                                        </span>
                                    </div>


                                </div>

                                <div
                                    className={`journal-entry-pnl ${
                                        isProfit ? "profit" : "loss"
                                    }`}
                                >
                                    {isProfit ? "+" : "-"}$
                                    {Math.abs(entry.pnl).toFixed(2)}
                                </div>
                               
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}


export default JournalEntriesCard;