import JournalTopHeader from "../Components/Journal/JournalTopHeader";
import JournalEntriesCard from "../Components/Journal/JournalEntriesCard";
import NavigationBar from "../Components/General/NavigationBar";
import TopHeader from "../Components/General/TopHeader";
import "../cssPages/Journal.css";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
  getJournalEntries,
} from "../services/journalApi";

import type {
  JournalEntry,
} from "../services/journalApi";

function Journal() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setError("Please log in to view your journal.");
                    setIsLoading(false);
                    return;
                }

                try {
                    setError("");

                    const journalEntries = await getJournalEntries();
                    setEntries(journalEntries);

                } catch (error) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load journal entries."
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
        ticker: entry.ticker,
        company: entry.title || entry.ticker,
        direction: entry.direction,
        entryPrice: entry.entryPrice,
        pnl: entry.pnl ?? 0,
    }));

    return (
        <div className="journal">
            <TopHeader />
            <JournalTopHeader />

            {isLoading && (
                <p className="journal-status">
                Loading journal entries...
                </p>
            )}

            {error && (
                <p className="journal-error">
                {error}
                </p>
            )}

            {!isLoading && !error && (
                <JournalEntriesCard
                entries={recentEntries}
                onViewAll={() => {
                    console.log("Open all journal entries");
                }}
                />
            )}



        </div>

    );
}

export default Journal;