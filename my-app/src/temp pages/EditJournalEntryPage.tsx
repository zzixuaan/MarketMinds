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
  "exitPrice",
  "quantity",
  "positionSize",
  //"riskToReward",
  "stopLoss",
  "takeProfit",
  //"maxFavourableExcursion",
  //"maxAdverseExcursion",
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

    function calculateRiskReward(
        entryPrice: number,
        stopLoss: number,
        takeProfit: number
    ): number | null {
        const risk = entryPrice - stopLoss;
        const reward = takeProfit - entryPrice;

        return Number((reward/risk).toFixed(2));
    }


    function calculatePosSize(
        quantity: number,
        entryPrice: number,
    ): number | null {
        return Number((quantity * entryPrice).toFixed(2));
    }


    function calculatePnL(
        quantity: number,
        entryPrice: number,
        exitPrice: number | null,
    ): number | null {
        if (exitPrice === null) {
            return null;
        }
        return Number((quantity * (exitPrice - entryPrice)).toFixed(2))

    }

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
                const parsedExecutionErrors =
                    parseExecutionErrors(entry.executionErrors);

            setForm({
                title: entry.title ?? "",
                ticker: entry.ticker ?? "",
                direction: entry.direction ?? "Buy",
                tradeStatus: entry.tradeStatus ?? "Open",

                entryPrice: entry.entryPrice ?? 0,
                quantity: entry.quantity ?? 0,
                positionSize: entry.positionSize ?? 0,
                timePeriod: entry.timePeriod ?? "",
                riskToReward:
                entry.riskToReward ?? 0,
                stopLoss: entry.stopLoss ?? 0,
                takeProfit: entry.takeProfit ?? 0,

                thesis: entry.thesis ?? "",
                catalyst: entry.catalyst ?? "",
                executionErrors:
                parsedExecutionErrors.notes,

                confidence: entry.confidence ?? 0,
                emotions: entry.emotions ?? "",
                pnl: entry.pnl ?? null,
                exitPrice: entry.exitPrice ?? null,

                lessonsLearnt:
                entry.lessonsLearnt ?? "",
            });

            setSelectedExecutionMistakes(parsedExecutionErrors.mistakes);

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

    function handleOptionButton(
        name: keyof JournalEntryInput,
        value: string | number
    ) {
        setForm((currentForm) => {
            if (!currentForm) {
                return currentForm;
            }

            if (name === "tradeStatus" && value === "Open") {
                setSelectedExecutionMistakes([]);

            return {
                ...currentForm,
                tradeStatus: "Open",
                exitPrice: null,
                pnl: null,
                executionErrors: "",
                lessonsLearnt: "",
            } as JournalEntryInput;
        }

        return {
            ...currentForm,
            [name]: value,
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

        
        if (form.confidence < 1 || form.confidence > 5) {
            setMessage("Please select a confidence level.");
            return;
        }

        if (!form.emotions) {
            setMessage("Please select an emotion.");
            return;
        }

        const calculatedRiskReward = calculateRiskReward(
                                        form.entryPrice,
                                        form.stopLoss,
                                        form.takeProfit
                                        );

        if (calculatedRiskReward === null) {
            setMessage(
                "Please enter a valid stop-loss and take-profit for this trade direction."
            );
            
            return;
        }

        const calculatedPosSize = calculatePosSize(form.quantity, form.entryPrice);

        if (calculatedPosSize === null) {
            setMessage(
                "Please enter a valid quantity and entry price for this trade direction."
            );
            
            return;
        }

        const calculatedPnL = form.tradeStatus === "Closed"
                                ? calculatePnL(form.quantity, form.entryPrice, form.exitPrice)
                                : null;
        
        if (form.tradeStatus === "Closed" && calculatedPnL === null) {
            setMessage(
                "Please enter a valid exit price for this trade direction."
            );
            
            return;
        }

        try {
            setIsSaving(true);

            const executionMistakeText =
                selectedExecutionMistakes.join(", ");

            const executionNotes =
                (form.executionErrors ?? "").trim();

            const finalExecutionErrors = form.tradeStatus === "Closed"
                                            ? [
                                                selectedExecutionMistakes.join(", "),
                                                (form.executionErrors ?? "").trim() 
                                                    ? `Notes: ${(form.executionErrors ?? "").trim()}`
                                                    : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" | ")
                                            : "";

            await updateJournalEntry(
                entryId,
                {
                    ...form,
                    positionSize: calculatedPosSize,
                    pnl: calculatedPnL,
                    riskToReward: calculatedRiskReward,
                    executionErrors: finalExecutionErrors,
                }
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

    function parseExecutionErrors(value?: string) {
        const savedValue = value ?? "";

        if (!savedValue.trim()) {
            return {
            mistakes: [],
            notes: "",
            };
        }

        const mistakes: string[] = [];
        const notes: string[] = [];

        const parts = savedValue
            .split("|")
            .map((part) => part.trim())
            .filter(Boolean);

        parts.forEach((part) => {
            if (part.toLowerCase().startsWith("notes:")) {
            notes.push(
                part.replace(/^notes:\s*/i, "")
            );
            return;
            }

            const candidates = part
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

            const matchedMistakes = candidates.filter(
            (item) =>
                executionMistakeOptions.includes(item)
            );

            const unmatchedText = candidates.filter(
            (item) =>
                !executionMistakeOptions.includes(item)
            );

            mistakes.push(...matchedMistakes);

            if (unmatchedText.length > 0) {
            notes.push(unmatchedText.join(", "));
            }
        });

        return {
            mistakes: Array.from(new Set(mistakes)),
            notes: notes.join(" | "),
        };
    }

    const previewRiskToReward = calculateRiskReward(
                                form.entryPrice,
                                form.stopLoss,
                                form.takeProfit
                                );


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
                    <label>Trade Status</label>

                    <div className="option-button-group">
                        <button
                            type="button"
                            className={
                                form.tradeStatus === "Open"
                                ? "option-button selected open"
                                : "option-button"
                            }
                            onClick={() =>
                                handleOptionButton("tradeStatus", "Open")
                            }
                        >
                        Open
                        </button>

                        <button
                            type="button"
                            className={
                                form.tradeStatus === "Closed"
                                ? "option-button selected closed"
                                : "option-button"
                            }
                            onClick={() =>
                                handleOptionButton("tradeStatus", "Closed")
                            }
                        >
                        Closed
                        </button>
                    </div>
                </div>


                <div className="form-row">
                    <label>Direction</label>

                    <div className="option-button-group">
                        <button
                            type="button"
                            className={
                                form.direction === "Buy"
                                ? "option-button selected buy"
                                : "option-button"
                            }
                            onClick={() =>
                                handleOptionButton("direction", "Buy")
                            }
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
                            onClick={() =>
                                handleOptionButton("direction", "Sell")
                            }
                        >
                        Sell
                        </button>
                    </div>
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
                    <label htmlFor="quantity">Quantity</label>

                    <input
                        type="number"
                        name="quantity"
                        value={form.quantity === 0 ? "" : form.quantity}
                        onChange={handleChange}
                        min="0"
                        step="1"
                        required
                    />
                </div>

                <div className="form-row">
                    <label>Calculated Position Size</label>

                    <div className="calculated-field">
                        {calculatePosSize(form.entryPrice, form.quantity) === null
                        ? "Enter entry price and quantity"
                        : `$${calculatePosSize(
                            form.entryPrice,
                            form.quantity
                            )?.toFixed(2)}`}
                    </div>
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
                    <label>Calculated Risk-to-Reward</label>

                    <div className="calculated-field">
                        {previewRiskToReward === null
                        ? "Enter valid entry, stop-loss and take-profit values"
                        : `1:${previewRiskToReward}`}
                    </div>
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
                    <label>Confidence</label>

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
                            handleOptionButton(
                                "confidence",
                                option.value
                            )
                            }
                        >
                            {option.label}
                        </button>
                        ))}
                    </div>
                </div>


                <div className="form-row">
                    <label>Emotions</label>

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
                
                {form.tradeStatus === "Closed" && (
                    <>
                        <h3>Trade Exit</h3>

                        <div className="form-row">
                            <label htmlFor="exitPrice">Exit Price</label>

                            <input
                                type="number"
                                name="exitPrice"
                                value={form.exitPrice ?? ""}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <label>Calculated PnL</label>

                            <div className="calculated-field">
                                {calculatePnL(
                                    form.quantity,
                                    form.entryPrice,
                                    form.exitPrice,
            
                                ) === null
                                ? "Enter exit price to calculate PnL"
                                : `$${calculatePnL(
                                        form.quantity,
                                        form.entryPrice,
                                        form.exitPrice,
                                        
                                    )?.toFixed(2)}`}
                            </div>
                        </div>


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
                            <label htmlFor="lessonsLearnt">Lessons Learnt</label>
                            <textarea
                                name="lessonsLearnt"
                                value={form.lessonsLearnt}
                                onChange={handleChange}
                            />
                            
                        </div>
                    </>
                )}
            

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

