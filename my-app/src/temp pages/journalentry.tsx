import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
    createJournalEntry,
    getJournalEntries,
} from "../services/journalApi";

import type {
    JournalEntry,
    JournalEntryInput,
} from "../services/journalApi";

const initialform: JournalEntryInput = {
    title: "",
    ticker: "",
    direction: "",
    entryPrice: 0,
    positionSize: 0,
    timePeriod: "",
    riskToReward: 0,
    thesis: "",
    catalyst: "",
    executionErrors: "",
    maxFavourableExcursion: 0,
    maxAdverseExcursion: 0,
    confidence: 0,
    emotions: "",
    pnl: 0,
};

const numericfields = new Set(["entryPrice", "positionSize", "riskToReward", "maxFavourableExcursion", "maxAdverseExcursion", "confidence", "pnl"]);

function JournalEntryPage() {
    const [form, setForm] = useState<JournalEntryInput>(initialform);
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setMessage("Please log in to view your journal.");
                    setIsLoading(false);
                    return;
                }

                try {
                    const savedEntries = await getJournalEntries();
                    setEntries(savedEntries);

                } catch (error) {
                    setMessage(
                        error instanceof Error ? error.message : "Unable to load journal entries."
                    );
                } finally {
                    setIsLoading(false);
                }
            }
        );

        return unsubscribe;
    }, []);

    function handleChange(
        event: ChangeEvent<
            HTMLInputElement |
            HTMLTextAreaElement |
            HTMLSelectElement
        >
    ) {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: numericfields.has(name) ? Number(value) : value,
        } as JournalEntryInput));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setMessage("");

        if (!form.ticker.trim()) {
            setMessage("Please enter a ticker symbol");
            return;
        }

        if (!form.thesis.trim()) {
            setMessage("Please enter a thesis");
            return;
        }

        try {
            setIsSaving(true);

            const savedEntry = await createJournalEntry(form);

            setEntries((currentEntries) => [
                savedEntry,
                ...currentEntries,
            ]);

            setForm(initialform);
            setMessage("Saved");
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message: "Failed to save"
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div className="journalentrypage">
            <h1>Trade Journal</h1>

            <form className="journalform" onSubmit={handleSubmit}>
                <label>Entry 
                    <input 
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Why I entered this trade"
                    />
                </label>

                <label>Ticker
                    <input 
                        type="text"
                        name="ticker"
                        value={form.ticker}
                        onChange={handleChange}
                        placeholder=""
                        required
                    />
                </label>

                <label>Direction
                    <select
                        name="direction"
                        value={form.direction}
                        onChange={handleChange}
                    >
                        <option value="Buy">Buy</option>
                        <option value="Sell">Sell</option>
                    </select>
                </label>

                <label>Entry Price
                    <input 
                        type="number"
                        name="entryPrice"
                        value={form.entryPrice}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step="0.01"
                        required
                    />
                </label>

                <label>Position Size
                    <input 
                        type="number"
                        name="positionSize"
                        value={form.positionSize}
                        onChange={handleChange}
                        placeholder=""
                        min= "0"
                        step= "0.01"
                        required
                    />
                </label>

                <label>Time Period
                    <input 
                        type="text"
                        name="timePeriod"
                        value={form.timePeriod}
                        onChange={handleChange}
                        placeholder=""
                        required
                    />
                </label>

                <label>Risk-to-reward ratio
                    <input 
                        type="number"
                        name="riskToReward"
                        value={form.riskToReward}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step="0.01"
                        required
                    />
                </label>

                <label>Trade Thesis
                    <textarea
                        name="thesis"
                        value={form.thesis}
                        onChange={handleChange}
                        placeholder="Reasons for this trade"
                        required
                    />
                </label>

                <label>Catalyst
                    <textarea
                        name="catalyst"
                        value={form.catalyst}
                        onChange={handleChange}
                        placeholder="What event will move the price?"
                        required
                    />
                </label>

                <label>Execution Errors
                    <textarea
                        name="executionErrors"
                        value={form.executionErrors}
                        onChange={handleChange}
                    />
                </label>


                <label>Minimum favourable excursion
                    <input 
                        type="number"
                        name="maxFavourableExcursion"
                        value={form.maxFavourableExcursion}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step="0.01"
                    />
                </label>

                <label>Maximum adverse excursion
                    <input 
                        type="number"
                        name="maxAdverseExcursion"
                        value={form.maxAdverseExcursion}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step="0.01"
                    />
                </label>

                <label>Confidence
                    <select
                        name="confidence"
                        value={form.confidence}
                        onChange={handleChange}
                    >
                        <option value="1">Very low</option>
                        <option value="2">Low</option>
                        <option value="3">Neutral</option>
                        <option value="4">High</option>
                        <option value="5">Very high</option>
                    </select>
                </label>


                <label>Emotions
                    <select
                        name="emotions"
                        value={form.emotions}
                        onChange={handleChange}
                    >
                        <option value="Confident">Confident</option>
                        <option value="Neutral">Neutral</option>
                        <option value="Excited">Excited</option>
                        <option value="Anxious">Anxious</option>
                        <option value="Fearful">Fearful</option>
                    </select>
                </label>

                <label>
                    PnL 
                    <input
                        type="number"
                        name="pnl"
                        value={form.pnl}
                        onChange={handleChange}
                        step="0.01"
                    />
                </label>

                <button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Journal Entry"}
                </button>


            </form>

        </div>
    )

}

export default JournalEntryPage;