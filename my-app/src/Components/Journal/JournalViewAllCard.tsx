import { useNavigate } from "react-router-dom"
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
    onDelete?: (entryId: string) => void;
    deletingEntryId?: string | null;
}

function JournalViewAllCard({entries, onViewAll, onDelete, deletingEntryId}: JournalEntriesCardProps ) {
    const navigate = useNavigate();
    
    return (
        <section className= "journal-entries">
            <div className= "journal-entries-header">
                <h3>All journal entries</h3>

            </div>

            {entries.length === 0 ? (
                <div className="journal-empty-state">
                    <p>No journal entries yet.</p>
                    <span> Make your first trade and create your first entry</span>
                </div>
            ) : (
                <div className="journal-entries-list">
                    {entries.map((entry) => {
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

                                <div className="buttons">

                                    <button
                                        type="button"
                                        className="journal-delete-button"
                                        onClick={() => navigate(`/journal/${entry.id}/edit`)}
                                    > Edit
                                    </button>

                                    <button
                                        type="button"
                                        className="journal-delete-button"
                                        onClick={() => onDelete?.(entry.id)}
                                        disabled={deletingEntryId === entry.id}
                                    >
                                        {deletingEntryId === entry.id
                                            ? "Deleting..."
                                            : "Delete"}
                                    </button>


                                </div>
                               
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}


export default JournalViewAllCard;