import "../cssPages/journalentrypage.css";
import TopHeader from "../Components/General/TopHeader";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
    CreateJournalEntry,
    getJournalEntries,
} from "../services/journalApi";

import type {
    JournalEntry,
    JournalEntryInput,
} from "../services/journalApi";

const initialform: JournalEntryInput = {
    title: "",
    ticker: "",
    direction: "Buy",
    entryPrice: 0,
    positionSize: 0,
    timePeriod: "",
    riskToReward: 0,
    stopLoss: 0,
    takeProfit:0,
    thesis: "",
    catalyst: "",
    executionErrors: "",
    maxFavourableExcursion: 0,
    maxAdverseExcursion: 0,
    confidence: 0,
    emotions: "",
    pnl: 0,
    lessonsLearnt: ""
};

const numericfields = new Set(["entryPrice", "positionSize", "riskToReward", "takeProfit", "stopLoss", "maxFavourableExcursion", "maxAdverseExcursion", "confidence", "pnl"]);

function JournalEntryPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<JournalEntryInput>(initialform);
    const [entries, setEntries] = useState<JournalEntry[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [showSuccess, setShowSuccess] = useState(false);
    const [selectedExecutionMistakes, setSelectedExecutionMistakes] = useState<string[]>([]);

    const emotionOptions = [
                    "Confident",
                    "Neutral",
                    "Excited",
                    "Anxious",
                    "Fearful",
                ];

    const confidenceOptions = [
                    { label: "Very low", value: 1 },
                    { label: "Low", value: 2 },
                    { label: "Neutral", value: 3 },
                    { label: "High", value: 4 },
                    { label: "Very high", value: 5 },
                ];

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

    function handleOptionButton(
        name: keyof JournalEntryInput,
        value: string | number
    ) {
        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        } as JournalEntryInput));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setMessage("");
        setShowSuccess(false);

        if (!form.ticker.trim()) {
            setMessage("Please enter a ticker symbol.");
            return;
        }

        if (!form.thesis.trim()) {
            setMessage("Please enter a thesis.");
            return;
        }

        if (form.confidence < 1 || form.confidence > 5) {
            setMessage("Please select a confidence level.");
            return;
        }

        if (!form.emotions) {
            setMessage("Please select an emotion.");
            return;
        }

        try {
            setIsSaving(true);

            const executionMistakeText =
                selectedExecutionMistakes.join(", ");

            const executionNotes =
                (form.executionErrors ?? "").trim();

            const finalExecutionErrors = [
                executionMistakeText,
                executionNotes
                    ? `Notes: ${executionNotes}`
                    : "",
            ]
                .filter(Boolean)
                .join(" | ");

            const savedEntry = await CreateJournalEntry({
                ...form,
                executionErrors: finalExecutionErrors,
            });

            setEntries((currentEntries) => [
                savedEntry,
                ...currentEntries,
            ]);

            setForm(initialform);
            setSelectedExecutionMistakes([]);
            setShowSuccess(true);

            window.setTimeout(() => {
                navigate("/journal", { replace: true });
            }, 1500);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Failed to save journal entry."
            );
        } finally {
            setIsSaving(false);
        }
    }

    function toggleExecutionMistake(mistake: string) {
        setSelectedExecutionMistakes((currentMistakes) => {
            if (mistake === "No major mistake") {
                return currentMistakes.includes("No major mistake")
                    ? []
                    : ["No major mistake"];
            }

            const withoutNoMistake = currentMistakes.filter(
                (item) => item !== "No major mistake"
            );

            if (withoutNoMistake.includes(mistake)) {
                return withoutNoMistake.filter(
                    (item) => item !== mistake
                );
            }

            return [...withoutNoMistake, mistake];
        });
    }

    return (

        <div className="journalentrypage">
            <TopHeader />
            <h1>Make a new entry</h1>

            <form className="journalform" onSubmit={handleSubmit}>
                <div className="form-row">
                    <label htmlFor="title">Entry</label>
                    <input 
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        placeholder="Why I entered this trade"
                    />
                </div>
                

                <h3>Trade Details</h3>


                <div className="form-row">
                    <label htmlFor="ticker">Ticker</label>
                    <input 
                        type="text"
                        name="ticker"
                        value={form.ticker}
                        onChange={handleChange}
                        placeholder=""
                        required
                    />
                    
                </div>
            

                

                <div className="form-row">
                    <label htmlFor="direction">Direction</label>

                    <div className="option-button-group">
                        <button
                            type="button"
                            className={
                                form.direction === "Buy"
                                ? "option-button selected buy"
                                : "option-button"
                            }
                            onClick={() => handleOptionButton("direction", "Buy")}
                        >
                            Buy
                        </button>

                        <button
                            type="button"
                            className={
                                form.direction === "Sell"
                                ? "option-button selected sell"
                                : "option-button"
                            }
                            onClick={() => handleOptionButton("direction", "Sell")}
                        >
                            Sell
                        </button>
                    </div>
                    
                </div>

                

                <div className="form-row">
                    <label htmlFor="entryPrice">Entry Price</label>
                    <input 
                        type="number"
                        name="entryPrice"
                        value={form.entryPrice === 0 ? "" : form.entryPrice}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step="0.01"
                        required
                    />
                    
                </div>
                

                <div className="form-row">
                    <label htmlFor="positionSize">Position Size</label>
                    <input 
                        type="number"
                        name="positionSize"
                        value={form.positionSize === 0 ? "" : form.positionSize}
                        onChange={handleChange}
                        placeholder=""
                        min="0"
                        step= "0.01"
                        required
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
                    <label>Execution Mistakes</label>

                    <div className="mistake-button-grid">
                        {executionMistakeOptions.map((mistake) => (
                        <button
                            key={mistake}
                            type="button"
                            className={
                            selectedExecutionMistakes.includes(mistake)
                                ? "mistake-button selected"
                                : "mistake-button"
                            }
                            onClick={() => toggleExecutionMistake(mistake)}
                        >
                            {mistake}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="form-row">
                    <label htmlFor="executionErrors">
                        Extra Notes
                    </label>

                    <textarea
                        name="executionErrors"
                        value={form.executionErrors}
                        onChange={handleChange}
                        placeholder="Add any extra details about what went wrong..."
                    />
                </div>
                

                <div className="form-row">
                    <label htmlFor="confidence">Confidence</label>

                    <div className="option-button-group">
                        {confidenceOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            className={
                            form.confidence === option.value
                                ? "option-button selected"
                                : "option-button"
                            }
                            onClick={() =>
                            handleOptionButton("confidence", option.value)
                            }
                        >
                            {option.label}
                        </button>
                        ))}
                    </div>
                </div>
                


                <div className="form-row">
                    <label htmlFor="emotions">Emotions</label>
                    <div className="option-button-group">
                        {emotionOptions.map((emotion) => (
                        <button
                            key={emotion}
                            type="button"
                            className={
                            form.emotions === emotion
                                ? "option-button selected"
                                : "option-button"
                            }
                            onClick={() =>
                            handleOptionButton("emotions", emotion)
                            }
                        >
                            {emotion}
                        </button>
                        ))}
                    </div>
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
                
                <div className="form-row">
                    <label htmlFor="lessonsLearnt">Lessons Learnt</label>
                    <textarea
                        name="lessonsLearnt"
                        value={form.lessonsLearnt}
                        onChange={handleChange}
                    />
                    
                </div>

                <div className="submit-button">
                    <button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Journal Entry"}
                    </button>
                </div>


            </form>

            {message && !showSuccess && (
                <div className="form-error-message">
                    {message}
                </div>
            )}

            {showSuccess && (
                <div className="success-popup-overlay">
                    <div className="success-popup">
                        <div className="success-popup-icon">✓</div>

                    <h2>Journal entry saved</h2>

                        <p>
                            Your trade journal entry was saved successfully.
                            Redirecting you to the journal page...
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                            navigate("/journal", { replace: true })
                            }
                        >
                            Go to Journal
                        </button>
                    </div>
                </div>
            )}

        </div>
    )

}

export default JournalEntryPage;