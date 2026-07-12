import JournalTopHeader from "../Components/Journal/JournalTopHeader";
import JournalEntriesCard from "../Components/Journal/JournalEntriesCard";
import NavigationBar from "../Components/General/NavigationBar";
import TopHeader from "../Components/General/TopHeader";
import "../cssPages/Journal.css";
import { useNavigate } from "react-router-dom";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
  getJournalEntries,
  deleteJournalEntry,
} from "../services/journalApi";

import type {
  JournalEntry,
} from "../services/journalApi";

function Journal() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

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

    async function handleDeleteEntry(entryId: string) {
        const confirmed = window.confirm(
            "Delete this journal entry? This cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingEntryId(entryId);
            setError("");

            await deleteJournalEntry(entryId);

            setEntries((currentEntries) =>
            currentEntries.filter(
                (entry) => entry.id !== entryId
            )
            );
        } catch (error) {
            setError(
            error instanceof Error
                ? error.message
                : "Unable to delete journal entry."
            );
        } finally {
            setDeletingEntryId(null);
        }
    }

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
                onEntryClick={(entryId) => navigate(`/journal/${entryId}`)}
                onViewAll={() => navigate(`/journalviewallpage`)}
                onDelete={handleDeleteEntry}
                deletingEntryId={deletingEntryId}
                />
            )}



        </div>

    );
}

export default Journal;