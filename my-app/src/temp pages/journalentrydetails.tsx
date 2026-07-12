import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
  getJournalEntry,
} from "../services/journalApi";

import type {
  JournalEntry,
} from "../services/journalApi";


import "../cssPages/journaldetailspage.css";



function parseExecutionErrors(value?: string) {
    const savedValue = value ?? "";

    if (!savedValue.trim()) {
        return {
            mistakes: [],
            notes: "",
        };
    }

    const parts = savedValue.split("|")
                            .map((part) => part.trim())
                            .filter(Boolean);
    
    const mistakes : string[] = [];
    const notes: string[] = [];

    parts.forEach((part) => {
        if (part.toLowerCase().startsWith("notes:")) {
            notes.push(part.replace(/^notes:\s*/i, ""));
        
        } else {
            mistakes.push(
                ...part
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            );
        }
    });


    return {
        mistakes,
        notes: notes.join("|"),
    };
}


function JournalDetailsPage() {
    const { entryId } = useParams();
    const navigate = useNavigate();

    const [entry, setEntry] =
        useState<JournalEntry | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth,
            async (user) => {
                if (!user) {
                    setError("Please log in to view this entry.");
                    setIsLoading(false);
                    return;
                }

                if (!entryId) {
                    setError("Journal entry ID is missing.");
                    setIsLoading(false);
                    return;
                }

                try {
                    const savedEntry = await getJournalEntry(entryId);
                    setEntry(savedEntry);
                } catch (error) {
                    setError(
                        error instanceof Error
                        ? error.message
                        : "Unable to load journal entry."
                    );
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return unsubscribe;
    }, [entryId]);

        if (isLoading) {
            return (
                <main className="journalentrypage">
                    <p>Loading journal entry...</p>
                </main>
            );
        }

        if (error) {
            return (
            <main className="journalentrypage">
                <p className="form-error-message">
                    {error}
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/journal")}
                >
                Back to Journal
                </button>
            </main>
            );
        }

        if (!entry) {
            return (
                <main className="journalentrypage">
                    <p>Journal entry not found.</p>
                </main>
            );
        }

    const parsedExecutionErrors =
        parseExecutionErrors(entry.executionErrors);

    return (
        <main className="journalentrypage">
            <button
                type="button"
                className="back-button"
                onClick={() => navigate("/journal")}
            >
                ← Back to Journal
            </button>

        <section className="entry-details-card">
            <div className="entry-details-header">
                <div>
                    <p className="entry-details-label">
                    Journal Entry
                    </p>

                    <h1>
                    {entry.title || entry.ticker}
                    </h1>

                    <p className="entry-details-subtitle">
                    {entry.ticker}
                    </p>
                </div>

                <span
                    className={
                    entry.direction === "Buy"
                        ? "direction-badge buy"
                        : "direction-badge sell"
                    }
                >
                    {entry.direction}
                </span>
            </div>

            <div className="details-grid">
                <Detail label="Entry Price" value={entry.entryPrice} />
                <Detail label="Position Size" value={entry.positionSize} />
                <Detail label="Time Period" value={entry.timePeriod} />
                <Detail label="Stop Loss" value={entry.stopLoss} />
                <Detail label="Take Profit" value={entry.takeProfit} />
                <Detail label="Risk-to-Reward" value={entry.riskToReward} />
                <Detail label="Confidence" value={`${entry.confidence}/5`} />
                <Detail label="Emotion" value={entry.emotions} />
                <Detail label="PnL" value={entry.pnl} />
                <Detail
                    label="Max Favourable Excursion"
                    value={entry.maxFavourableExcursion}
                />
                <Detail
                    label="Max Adverse Excursion"
                    value={entry.maxAdverseExcursion}
                />
            </div>

            <DetailSection
                title="Trade Thesis"
                value={entry.thesis}
            />

            <DetailSection
                title="Catalyst"
                value={entry.catalyst}
            />

            <section className="details-section">
                <h2>Execution Mistakes</h2>

                {parsedExecutionErrors.mistakes.length > 0 ? (
                    <div className="mistake-chip-list">
                    {parsedExecutionErrors.mistakes.map((mistake) => (
                        <span
                        key={mistake}
                        className="mistake-detail-chip"
                        >
                        {mistake}
                        </span>
                    ))}
                    </div>
                ) : (
                    <p>None recorded</p>
                )}

                {parsedExecutionErrors.notes && (
                    <>
                        <h3>Extra Notes</h3>
                        <p>{parsedExecutionErrors.notes}</p>
                    </>
                )}
            </section>

            <DetailSection
                title="Lessons Learnt"
                value={entry.lessonsLearnt}
            />

                <div className="entry-details-actions">
                    <button
                        type="button"
                        onClick={() =>
                        navigate(`/journal/${entry.id}/edit`)
                        }
                    >
                        Edit Entry
                    </button>
                </div>
            </section>
        </main>
    );
    }

    interface DetailProps {
        label: string;
        value:
            | string
            | number
            | null
            | undefined;
    }

    function Detail({ label, value }: DetailProps) {
        return (
            <div className="detail-item">
                <span>{label}</span>

                <strong>
                    {value === undefined ||
                    value === null ||
                    value === ""
                    ? "Not provided"
                    : value}
                </strong>
            </div>
        );
    }

    interface DetailSectionProps {
    title: string;
    value?: string | null;
    }

    function DetailSection({
        title,
        value,
    }: DetailSectionProps) {
        return (
            <section className="details-section">
                <h2>{title}</h2>

                <p>
                    {value && value.trim()
                    ? value
                    : "Not provided"}
                </p>
            </section>
        );
    }

    export default JournalDetailsPage;
    