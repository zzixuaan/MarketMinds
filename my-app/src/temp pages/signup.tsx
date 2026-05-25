import { auth } from '../firebase-config';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'

export const SIGNUP = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const signUp = async () => {
        if (password != confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await createUserWithEmailAndPassword(auth, email, password);

            navigate("/");

        } catch (err: unknown) {
            if (err instanceof Error) {
                switch ((err as any).code) {

                    case "auth/email-already-in-use":
                        setError("Email is already in use.");
                        break;
                    
                    case "auth/invalid-email":
                        setError("Please enter a valid email.")
                        break;

                    case "auth/weak-password":
                        setError("Password should be at least 8 characters, contain an uppercase character and a number.")
                        break;
                    
                    default:
                        setError("Signup failed. Please check your email/password.")
                }
            } 
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h1>Sign Up</h1>

            <input 
                placeholder = "Email" 
                value = {email}
                onChange = {(e) => setEmail(e.target.value)}
            />
            <br />
            <br />
            <input 
                placeholder = "Password" 
                type = "password"
                value = {password}
                onChange = {(e) => setPassword(e.target.value)}
            />
            <br />
            <br />
            <input 
                placeholder = "Confirm Password"
                type = "password"
                value = {confirmPassword}
                onChange = {(e) => setConfirmPassword(e.target.value)}
            />
            <br />
            <br />
            <button 
                onClick = {signUp} 
                disabled = {loading}
            >{loading ? "Creating account..." : "Sign Up"}
            </button>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <p> Already have an account?{" "}
                <button onClick={() => navigate("/")}>
                    Login
                </button>
            </p>
        </div>
    );
};

