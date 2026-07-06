import "../cssPages/EditJournalEntryPage.css";
import TopHeader from "../Components/General/TopHeader";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase-config";

import {
  getJournalEntry,
  updateJournalEntry,
} from "../services/journalApi";

import type {
  JournalEntryInput,
} from "../services/journalApi";

const numericFields = new Set([
  "entryPrice",
  "positionSize",
  "riskToReward",
  "stopLoss",
  "takeProfit",
  "maxFavourableExcursion",
  "maxAdverseExcursion",
  "confidence",
  "pnl",
]);

function EditJournalEntryPage() {
    const { entryId } = useParams();
    const navigate = useNavigate();

    const [form, setForm] =
        useState<JournalEntryInput | null>(null);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [message, setMessage] =
        useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
            if (!user) {
            setMessage(
                "Please log in to edit this entry."
            );
            setIsLoading(false);
            return;
            }

            if (!entryId) {
            setMessage(
                "Journal entry ID is missing."
            );
            setIsLoading(false);
            return;
            }

            try {
            const entry =
                await getJournalEntry(entryId);

            setForm({
                title: entry.title ?? "",
                ticker: entry.ticker ?? "",
                direction: entry.direction ?? "Buy",

                entryPrice: entry.entryPrice ?? 0,
                positionSize: entry.positionSize ?? 0,
                timePeriod: entry.timePeriod ?? "",
                riskToReward:
                entry.riskToReward ?? 0,
                stopLoss: entry.stopLoss ?? 0,
                takeProfit: entry.takeProfit ?? 0,

                thesis: entry.thesis ?? "",
                catalyst: entry.catalyst ?? "",
                executionErrors:
                entry.executionErrors ?? "",

                maxFavourableExcursion:
                entry.maxFavourableExcursion ?? 0,

                maxAdverseExcursion:
                entry.maxAdverseExcursion ?? 0,

                confidence: entry.confidence ?? 0,
                emotions: entry.emotions ?? "",
                pnl: entry.pnl ?? 0,

                lessonsLearnt:
                entry.lessonsLearnt ?? "",
            });
            } catch (error) {
            setMessage(
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

    function handleChange(
        event: ChangeEvent<
        | HTMLInputElement
        | HTMLTextAreaElement
        | HTMLSelectElement
        >
    ) {
        if (!form) {
        return;
        }

        const { name, value } = event.target;

        setForm((currentForm) => {
        if (!currentForm) {
            return currentForm;
        }

        return {
            ...currentForm,
            [name]: numericFields.has(name)
            ? Number(value)
            : value,
        } as JournalEntryInput;
        });
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!entryId || !form) {
        return;
        }

        setMessage("");

        if (!form.ticker.trim()) {
        setMessage(
            "Please enter a ticker symbol."
        );
        return;
        }

        if (!form.thesis.trim()) {
        setMessage(
            "Please enter a trade thesis."
        );
        return;
        }

        try {
        setIsSaving(true);

        await updateJournalEntry(
            entryId,
            form
        );

        window.alert(
            "Journal entry updated successfully."
        );

        navigate(
            `/journal/${entryId}`,
            { replace: true }
        );
        } catch (error) {
        setMessage(
            error instanceof Error
            ? error.message
            : "Unable to update journal entry."
        );
        } finally {
        setIsSaving(false);
        }
    }

    if (isLoading) {
        return <p>Loading entry...</p>;
    }

    if (!form) {
        return (
        <div>
            <p>
            {message || "Entry could not be loaded."}
            </p>

            <button
            type="button"
            onClick={() => navigate("/journal")}
            >
            Back to Journal
            </button>
        </div>
        );
    }

    return (
        <main className="journalentrypage">
            <TopHeader />

        <h1>Edit Journal Entry</h1>

        {message && (
            <p className="form-error-message">
            {message}
            </p>
        )}

        <form
            className="journalform"
            onSubmit={handleSubmit}
        >
            <div className="form-row">
            <label htmlFor="title">
                Entry title
            </label>

            <input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
            />
            </div>

            <div className="form-row">
            <label htmlFor="ticker">
                Ticker
            </label>

            <input
                id="ticker"
                type="text"
                name="ticker"
                value={form.ticker}
                onChange={handleChange}
                required
            />
            </div>

            <div className="form-row">
            <label htmlFor="direction">
                Direction
            </label>

            <select
                id="direction"
                name="direction"
                value={form.direction}
                onChange={handleChange}
            >
                <option value="Buy">
                Buy
                </option>

                <option value="Sell">
                Sell
                </option>
            </select>
            </div>

            <div className="form-row">
            <label htmlFor="entryPrice">
                Entry price
            </label>

            <input
                id="entryPrice"
                type="number"
                name="entryPrice"
                value={form.entryPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
            />
            </div>

            <div className="form-row">
            <label htmlFor="positionSize">
                Position size
            </label>

            <input
                id="positionSize"
                type="number"
                name="positionSize"
                value={form.positionSize}
                onChange={handleChange}
                min="0"
                step="0.01"
            />
            </div>

            <div className="form-row">
                <label htmlFor="timePeriod">Time Period</label>
                <input 
                    type="text"
                    name="timePeriod"
                    value={form.timePeriod}
                    onChange={handleChange}
                    placeholder=""
                    required
                />
                
            </div>

            <div className="form-row">
                <label htmlFor="stopLoss">Stop-Loss</label>
                <input 
                    type="number"
                    name="stopLoss"
                    value={form.stopLoss === 0 ? "" : form.stopLoss}
                    onChange={handleChange}
                    placeholder=""
                    min="0"
                    step="0.01"
                    required
                />
                
            </div>
            

            <div className="form-row">
                <label htmlFor="takeProfit">Take Profit</label>
                <input 
                    type="number"
                    name="takeProfit"
                    value={form.takeProfit === 0 ? "" : form.takeProfit}
                    onChange={handleChange}
                    placeholder=""
                    min="0"
                    step="0.01"
                    required
                />
                
            </div>
            

            <div className="form-row">
                <label htmlFor="riskToReward">Risk-to-reward ratio</label>
                <input 
                    type="number"
                    name="riskToReward"
                    value={form.riskToReward === 0 ? "" : form.riskToReward}
                    onChange={handleChange}
                    placeholder=""
                    min="0"
                    step="0.01"
                    required
                />
                
            </div>
            
            

            <h3>Trade Rationale</h3>

            <div className="form-row">
                <label htmlFor="thesis">Trade Thesis</label>
                <textarea
                    name="thesis"
                    value={form.thesis}
                    onChange={handleChange}
                    placeholder="Reasons for this trade"
                    required
                />
                
            </div>
            

            <div className="form-row">
                <label htmlFor="catalyst">Catalyst</label>
                <textarea
                    name="catalyst"
                    value={form.catalyst}
                    onChange={handleChange}
                    placeholder="What event will move the price?"
                    required
                />
                
            </div>
            
            

            <h3>Trade Execution</h3>

            <div className="form-row">
                <label htmlFor="executionErrors">Execution Errors</label>
                <textarea
                    name="executionErrors"
                    value={form.executionErrors}
                    onChange={handleChange}
                />
                
            </div>
            

            <div className="form-row">
                <label htmlFor="confidence">Confidence</label>
                <select
                    name="confidence"
                    value={form.confidence}
                    onChange={handleChange}
                >
                    <option value="0" disabled>Select an option</option>
                    <option value="1">Very low</option>
                    <option value="2">Low</option>
                    <option value="3">Neutral</option>
                    <option value="4">High</option>
                    <option value="5">Very high</option>
                </select>
            </div>
            


            <div className="form-row">
                <label htmlFor="emotions">Emotions</label>
                <select
                    name="emotions"
                    value={form.emotions}
                    onChange={handleChange}
                >
                    <option value="Select" disabled>Select an option</option>
                    <option value="Confident">Confident</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Excited">Excited</option>
                    <option value="Anxious">Anxious</option>
                    <option value="Fearful">Fearful</option>
                </select>
            </div>
            
            

            <h3>Trade Exit</h3>


            <div className="form-row">
                <label htmlFor="maxFavourableExcursion">Minimum favourable excursion</label>
                <input 
                    type="number"
                    name="maxFavourableExcursion"
                    value={form.maxFavourableExcursion === 0 ? "" : form.maxFavourableExcursion}
                    onChange={handleChange}
                    placeholder=""
                    min="0"
                    step="0.01"
                />
            </div>
            

            <div className="form-row">
                <label htmlFor="maxAdverseExcursion">Maximum adverse excursion</label>
                <input 
                    type="number"
                    name="maxAdverseExcursion"
                    value={form.maxAdverseExcursion === 0 ? "" : form.maxAdverseExcursion}
                    onChange={handleChange}
                    placeholder=""
                    min="0"
                    step="0.01"
                />
            </div>
            


            <div className="form-row">
                <label htmlFor="pnl">PnL</label>

                <input
                    type="number"
                    name="pnl"
                    value={form.pnl === 0 ? "" : form.pnl}
                    onChange={handleChange}
                    step="0.01"
                />

            </div>

            <div className="submit-button">
                <button type="submit" disabled={isSaving}>
                {isSaving ? "Updating..." : "Update Journal Entry"}
                </button>
            </div>

            <div className="cancel-button">
                <button
                    type="button"
                    onClick={() =>
                    navigate(`/journal`)
                    }
                >
                    Cancel
                </button>
            </div>
        
        </form>
        </main>
    );
    }

export default EditJournalEntryPage;

