import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, database } from "../firebase-config";
import { doc, updateDoc } from "firebase/firestore";

import "../cssPages/onboarding.css";

export const Onboarding = () => {
    const [startingCapital, setStartingCapital] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleFinish = async () => {
        try {
            setError("");
            setLoading(true);

            const user = auth.currentUser;

            if (!user) {
                return;
            }            
            
            const userRef = doc(database, "users", user.uid);
            const capital = Number(startingCapital);

            if (capital <= 0) {
                setError("Please enter a valid starting capital.")
                return;
            }

            await updateDoc(userRef, {startingCapital: capital, cash: capital, onboardingComplete: true});
            navigate("/home");

        } catch (err) {
            console.error("Onboarding failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-page">
            <div className="onboarding-welcome">
                Welcome to MarketMinds!
            </div>

            <div className="onboarding-form">
                <p>Enter your starting capital:</p>
                <input
                    type = "number"
                    min = "1"
                    step = "1"
                    value = {startingCapital}
                    onChange = {(e) => setStartingCapital(e.target.value)}
                    placeholder = "e.g. 5000"
                />
                {error && <p style={{ color: "red" }}>{error}</p>}
                <button onClick = {handleFinish} disabled = {loading}>
                    {loading ? "Saving..." : "Submit"}
                </button>
                
            </div>
            
        </div>
    );
};

