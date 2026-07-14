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
    tradeStatus: "Open",
    ticker: "",
    direction: "Buy",
    entryPrice: 0,
    quantity: 0,
    positionSize: 0,
    timePeriod: "",
    riskToReward: 0,
    stopLoss: 0,
    takeProfit:0,
    thesis: "",
    catalyst: "",
    executionErrors: "",
    //maxFavourableExcursion: 0,
    //maxAdverseExcursion: 0,
    confidence: 0,
    emotions: "",
    exitPrice: 0,
    pnl: 0,
    lessonsLearnt: ""
};

const numericfields = new Set(["entryPrice", "quantity", "exitPrice", "positionSize", "takeProfit", "stopLoss", "confidence", "pnl"]);

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
        value: string | number | null
    ) {
        setForm((currentForm) => {
            if (name === "tradeStatus" && value === "Open") {
                setSelectedExecutionMistakes([]);

                return {
                    ...currentForm,
                    tradeStatus: "Open",
                    exitPrice: null,
                    exitDate: null,
                    pnl: null,
                    executionErrors: "",
                    maxFavourableExcursion: null,
                    maxAdverseExcursion: null,
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
                                

            const savedEntry = await CreateJournalEntry({
                ...form,
                positionSize: calculatedPosSize,
                riskToReward: calculatedRiskReward,
                executionErrors: finalExecutionErrors,
                pnl: calculatedPnL,
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

    const previewRiskToReward = calculateRiskReward(
                                    form.entryPrice,
                                    form.stopLoss,
                                    form.takeProfit
    );

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
                    <label htmlFor="trade_status">Trade Status</label>

                    <div className="option-button-group">
                        <button
                            type="button"
                            className={
                                form.tradeStatus === "Open"
                                ? "option-button selected open"
                                : "option-button"
                            }
                            onClick={() => handleOptionButton("tradeStatus", "Open")}
                        >
                            Open
                        </button>

                        <button
                            type="button"
                            className={
                                form.tradeStatus=== "Closed"
                                ? "option-button selected closed"
                                : "option-button"
                            }
                            onClick={() => handleOptionButton("tradeStatus", "Closed")}
                        >
                            Closed
                        </button>
                    </div>
                    
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
                        {previewRiskToReward === null || !Number.isFinite(previewRiskToReward)
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