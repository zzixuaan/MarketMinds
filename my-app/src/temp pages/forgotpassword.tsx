import "../cssPages/auth.css";
import "../cssPages/forgotpassword.css";
import "../cssComponents/BluePurpleGradientButton.css";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase-config';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaEnvelope } from 'react-icons/fa'; 


export const ForgotPassword = () =>  {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    const resetPassword = async () => {
        try {
            setLoading(true);
            setError("");
            setMessage("");

            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Please check your inbox or spam folder");
        } catch (err : any) {
            switch (err.code) {

                case "auth/invalid-email": 
                    setError("Please enter a valid email");
                    break;

                default: 
                    setError("Failed to send email. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className = "auth-page">
            <div className = "forgot-password-container">
                <button
                    type="button"
                    onClick={() => navigate("/")}
                >Back to Login</button>
                <form className = "forgot-password-form"
                    onSubmit = {(e) => {e.preventDefault();
                                        resetPassword();}}
                >
                    <h1>Reset Password</h1>
                    <div className = "input-container">
                        {FaEnvelope({ className: "input-icon" })}
                        <input 
                            className = "login-input"
                            type = "email"
                            placeholder = "Email"
                            value = {email}
                            onChange = {(e) => setEmail(e.target.value)}
                        />
                    </div>  
                    {error && <p style={{ color: "red" }}>{error}</p>}
                    {message && <p style={{ color: "lightgreen" }}>{message}</p>}                    
                    <button className = "blue-purple-button"
                        type = "submit"
                        disabled = {loading}
                    >{loading ? "Sending..." : "SEND RESET EMAIL"}
                    </button>                    
                </form>
            </div>
        </div>
    );
    
};