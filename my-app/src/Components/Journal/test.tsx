import { useState } from "react";

import {
  createJournalEntry,
  getJournalEntries,
} from "../../services/journalApi";

import type {
    JournalEntry,
} from "../../services/journalApi";


export default function JournalApiTest() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCreateTestEntry() {
    try {
      setIsLoading(true);
      setMessage("");

      const savedEntry = await createJournalEntry({
        title: "My first backend test",
        ticker: "AAPL",
        direction: "Buy",
        entryPrice: 200,
        positionSize: 5,
        timePeriod: "3 months",
        riskToReward: 2,
        thesis:
          "I believe the company's services business will continue growing.",
        catalyst:
          "The share price may increase over the next three months.",

        executionErrors: "",
        maxFavourableExcursion: 0,
        maxAdverseExcursion: 0,

        confidence: 4,
        emotions: "Confident",

        pnl: 0,
      });

      setEntries((currentEntries) => [
        savedEntry,
        ...currentEntries,
      ]);

      setMessage(
        `Entry created successfully: ${savedEntry.id}`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create entry."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoadEntries() {
    try {
      setIsLoading(true);
      setMessage("");

      const savedEntries = await getJournalEntries();

      setEntries(savedEntries);
      setMessage(
        `Loaded ${savedEntries.length} journal entries.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load entries."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <h1>Journal API Test</h1>

      <button
        type="button"
        onClick={handleCreateTestEntry}
        disabled={isLoading}
      >
        Create test journal entry
      </button>

      <button
        type="button"
        onClick={handleLoadEntries}
        disabled={isLoading}
      >
        Load journal entries
      </button>

      {isLoading && <p>Working...</p>}

      {message && <p>{message}</p>}

      <section>
        {entries.map((entry) => (
          <article key={entry.id}>
            <h2>{entry.title}</h2>
            <p>
              {entry.ticker} — {entry.direction}
            </p>
            <p>Entry price: ${entry.entryPrice}</p>
            <p>Position size: {entry.positionSize}</p>
            <p>Thesis: {entry.thesis}</p>
            <p>
              Confidence: {entry.confidence}/5
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}