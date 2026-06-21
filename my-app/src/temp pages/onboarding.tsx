import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, database } from "../firebase-config";
import { doc, updateDoc } from "firebase/firestore";

export const Onboarding = () => {
    const [startingCapital, setStartingCapital] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleFinish = async () => {
        try {
            setLoading(true);

            const user = auth.currentUser;

            if (!user) {
                return;
            }            
            
            const userRef = doc(database, "users", user.uid);

            await updateDoc(userRef, {startingCapital: Number(startingCapital), onboardingComplete: true});
            navigate("/home");

        } catch (err) {
            console.error("Onboarding failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Welcome to MarketMinds!</h1>
            <p>Enter your starting capital:</p>
            <input
                type = "number"
                value = {startingCapital}
                onChange = {(e) => setStartingCapital(e.target.value)}
                placeholder = "e.g. 5000"
            />
            <button onClick = {handleFinish} disabled = {loading}>
                {loading ? "Saving..." : "Submit"}
            </button>
        </div>
    );
};

