import { useMemo } from "react";
import "../../cssComponents/journalstats.css";

import type {
    JournalEntry,
} from "../../services/journalApi";

interface JournalStatsDashboardProps {
    entries: JournalEntry[];
}

const executionMistakeOptions = [
    "Chased entry",
    "Entered too early",
    "Entered too late",
    "Ignored stop loss",
    "Moved stop loss",
    "Oversized position",
    "Poor risk-to-reward",
    "No clear plan",
    "FOMO",
    "Revenge trade",
    "Hesitated on entry",
    "Exited too early",
    "Held too long",
    "Overtraded",
    "No major mistake",
];

function percentage(
    value: number,
    total: number
) {
    if (total === 0) {
        return "0%";
    }

    return `${Math.round((value/total) * 100)}%`;
}

function extractExecutionMistakes(
    executionErrors?: string
) {
    const text = executionErrors ?? "";

    if (!text.trim()) {
        return [];
    }

    const parts = text.split("|")
                        .map((part) => part.trim())
                        .filter(Boolean);
    
    const mistakeParts = parts.filter((part) => !part.toLowerCase().startsWith("notes:"));

    const mistakes = mistakeParts.flatMap((part) => part.split(",")
                                    .map((item) => item.trim())
                                    .filter(Boolean))
                                .filter((mistake) => executionMistakeOptions.includes(mistake));
    
    return mistakes;
}


function countItems(items: string[]) {
    return items.reduce<Record<string, number>>(
        (counts, item) => {
            counts[item] = (counts[item] ?? 0) + 1;
            return counts;
        },
        {}
    );
}


function JournalStats({
    entries,
}: JournalStatsDashboardProps) {
    const stats = useMemo(() => {
        const totalEntries = entries.length;

        const entriesWithConfidence = 
            entries.filter(
                (entry) => 
                    typeof entry.confidence === "number" &&
                entry.confidence > 0
            );
        
        const averageConfidence = 
            entriesWithConfidence.length > 0
            ? entriesWithConfidence.reduce(
                (sum, entry) => sum + entry.confidence, 0) / entriesWithConfidence.length
            : 0;
        
        const allMistakes = entries.flatMap((entry) => 
        extractExecutionMistakes(entry.executionErrors));

        const mistakeCounts = countItems(allMistakes);

        const rankedMistakes = Object.entries(mistakeCounts)
                                        .map(([mistake, count]) => ({
                                            mistake,
                                            count,
                                        }))
                                        .sort((a, b) => b.count - a.count);
        
        const emotionCounts = countItems(
            entries
                .map((entry) => entry.emotions)
                .filter(Boolean)
        );

        const rankedEmotions = Object.entries(
            emotionCounts
        )
            .map(([emotion, count]) => ({
                emotion,
                count,
            }))
            .sort((a, b) => b.count - a.count);
        
        const openEntries = entries.filter((entry) => entry.tradeStatus === "Open");

        const closedEntries = entries.filter((entry) => entry.tradeStatus === "Closed");

        const avgRR = entries.reduce((sum, entry) => sum + entry.riskToReward, 0) / totalEntries;

        const profitableTrades = closedEntries.filter((entry) => typeof entry.pnl === "number" && entry.pnl > 0);

        const unprofitableTrades = closedEntries.filter((entry) => typeof entry.pnl === "number" && entry.pnl <= 0);

        const avgWin = profitableTrades.filter((entry) => typeof entry.pnl === "number").reduce((sum, entry) => sum + (entry.pnl ?? 0), 0) / profitableTrades.length;

        const avgLoss = unprofitableTrades.reduce((sum, entry) => sum + (entry.pnl ?? 0), 0) / unprofitableTrades.length;

        const profitFactor = profitableTrades.reduce((sum, entry) => sum + (entry.pnl ?? 0), 0) / unprofitableTrades.reduce((sum, entry) => sum + (entry.pnl ?? 0), 0);
        





        return {
            totalEntries,
            averageConfidence,
            rankedMistakes,
            rankedEmotions,
            openEntries,
            closedEntries,
            avgRR,
            profitableTrades,
            unprofitableTrades,
            avgWin,
            avgLoss,
            profitFactor

        };

    }, [entries]);

    return (
        <section className="journal-stats-dashboard">
            <div className="journal-stats-header">
                <div>
                    <p>Journal analytics</p>
                    <h2>Trading Performance Summary</h2>
                </div>
            </div>

            <div className="stats-card-grid-5">
                <StatCard
                label="Total Entries"
                value={stats.totalEntries}
                />

                <StatCard
                label="Open Entries"
                value={stats.openEntries.length}
                />

                <StatCard
                label="Closed Entries"
                value={stats.closedEntries.length}
                />

                <StatCard
                label="Average Confidence"
                value={
                    stats.averageConfidence > 0
                    ? `${stats.averageConfidence.toFixed(1)}/5`
                    : "N/A"
                }
                />

                <StatCard
                label="Average Risk To Reward"
                value={stats.totalEntries > 0 
                        ? `1: ${(stats.avgRR).toFixed(2)}`
                        : "N/A"}
                />
            </div>

            <div className="stats-card-grid-4">
    

                <StatCard
                label="Win Rate"
                value={(stats.profitableTrades.length/stats.totalEntries).toFixed(2)}
                />

                <StatCard
                label="Average Win"
                value={stats.avgWin}
                />

                <StatCard
                label="Average Loss"
                value={stats.avgLoss}
                />

                <StatCard
                label="Profit Factor"
                value={stats.profitFactor}
                />


            </div>

            <div className="stats-breakdown-grid">
                <RankedList
                title="Most Common Execution Mistakes"
                emptyMessage="No execution mistakes recorded yet."
                items={stats.rankedMistakes.map(
                    (item) => ({
                    label: item.mistake,
                    count: item.count,
                    })
                )}
                />

                <RankedList
                title="Most Common Emotions"
                emptyMessage="No emotions recorded yet."
                items={stats.rankedEmotions.map(
                    (item) => ({
                    label: item.emotion,
                    count: item.count,
                    })
                )}
                />
            </div>
        </section>
    );
}

interface StatCardProps {
    label: string;
    value: string | number;
    positive?: boolean;
}

function StatCard({
    label,
    value,
    positive,
}: StatCardProps) {
    return (
        <div className="stat-card">
            <span>{label}</span>

            <strong
                className={
                positive === undefined
                    ? ""
                    : positive
                    ? "positive-stat"
                    : "negative-stat"
                }
            >
                {value}
            </strong>
        </div>
    );
}

interface BreakdownRowProps {
    label: string;
    count: number;
    total: number;
}

function BreakdownRow({
    label,
    count,
    total,
}: BreakdownRowProps) {
    const width =
        total > 0 ? `${(count / total) * 100}%` : "0%";

    return (
        <div className="breakdown-row">
            <div className="breakdown-row-top">
                <span>{label}</span>
                <strong>
                {count} · {percentage(count, total)}
                </strong>
            </div>

            <div className="breakdown-bar">
                <div
                className="breakdown-bar-fill"
                style={{ width }}
                />
            </div>
        </div>
    );
}

interface RankedListProps {
    title: string;
    emptyMessage: string;
    items: {
        label: string;
        count: number;
    }[];
}

function RankedList({
    title,
    emptyMessage,
    items,
}: RankedListProps) {
    const highestCount =
        items.length > 0 ? items[0].count : 0;

    return (
        <div className="stats-panel">
            <h3>{title}</h3>

            {items.length === 0 ? (
                <p className="stats-empty-message">
                {emptyMessage}
                </p>
            ) : (
                <div className="ranked-list">
                {items.map((item, index) => {
                    const width =
                    highestCount > 0
                        ? `${(item.count / highestCount) * 100}%`
                        : "0%";

                    return (
                    <div
                        key={item.label}
                        className="ranked-list-item"
                    >
                        <div className="ranked-list-top">
                            <span>
                                #{index + 1} {item.label}
                            </span>

                            <strong>{item.count}</strong>
                        </div>

                        <div className="ranked-bar">
                            <div
                                className="ranked-bar-fill"
                                style={{ width }}
                            />
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
    );
}

export default JournalStats;

