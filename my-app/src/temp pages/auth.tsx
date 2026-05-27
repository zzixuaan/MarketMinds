import { auth, googleProvider } from '../firebase-config';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGoogle } from 'react-icons/fa'; 
import { FaRegUser } from 'react-icons/fa'; 
import { FaKey } from 'react-icons/fa'; 
import { FaEye } from 'react-icons/fa'; 
import { FaEnvelope } from 'react-icons/fa'; 
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import "../cssPages/auth.css";

export const AUTH = () => {
    // for signin
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);

   // for signup
   const [signupEmail, setSignupEmail] = useState("");
   const [signupPassword, setSignupPassword] = useState("");
   const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

   const [signupError, setSignupError] = useState("");
   const [signupLoading, setSignupLoading] = useState(false);

    // common
   const navigate = useNavigate();

   // animation state
   const [isActive, setIsActive] = useState(false);


   const signIn = async () => {
       try {
           setLoading(true);
           setError("");
          
           await signInWithEmailAndPassword(auth, email, password);
           navigate("/home");


       } catch (err: unknown) {
           if (err instanceof Error) {
               switch ((err as any).code) {


                   case "auth/invalid-email":
                       setError("Please enter a valid email.");
                       break;
                  
                   case "auth/invalid-credential":
                       setError("Invalid email or password.");
                       break;
                  
                   case "auth/too-many-requests":
                       setError("Too many attempts. Please try again later.");
                       break;
                  
                   case "auth/network-request-failed":
                       setError("Network error.");
                       break;
                  
                   default:
                       setError("Login failed. Please check your email/password.");
                  
               }
           }
       } finally {
           setLoading(false);
       }
   };


   const signInWithGoogle = async () => {
       try {
           setLoading(true);
           setError("");

           await signInWithPopup(auth, googleProvider);
           navigate ("/home");

       } catch (err: any) {
           setError("Google sign-in failed.");
       } finally {
           setLoading(false);
       }
   }

   const signUp = async () => {
           if (signupPassword != signupConfirmPassword) {
               setSignupError("Passwords do not match.");
               return;
           }
   
           try {
               setSignupLoading(true);
               setSignupError("");
   
               await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
   
               navigate("/home");
   
           } catch (err: unknown) {
               if (err instanceof Error) {
                   switch ((err as any).code) {
   
                       case "auth/email-already-in-use":
                           setSignupError("Email is already in use.");
                           break;
                       
                       case "auth/invalid-email":
                           setSignupError("Please enter a valid email.")
                           break;
   
                       case "auth/weak-password":
                           setSignupError("Password should be at least 8 characters, contain an uppercase character and a number.")
                           break;
                       
                       default:
                           setSignupError("Signup failed. Please check your email/password.")
                   }
               } 
           } finally {
               setSignupLoading(false);
           }
       };
  
   return (
        <div className = "auth-page">
            <div className = {`form-container ${isActive ? "active" : ""}`}>
                <div className = "login-container">
                    <form className = "login-form"
                        onSubmit = {(e) => {e.preventDefault();
                                            signIn();}}  
                    >
                        <h1>Sign In</h1>
                        <div className = "google-login-container">
                            <button className = "google-button"
                                type = "button"
                                onClick = {signInWithGoogle}
                                disabled = {loading}
                            >
                                {FaGoogle ({})}{" "}
                                Continue with Google
                            </button>
                        </div>
                        <div className = "divider-container">
                            <div className = "divider-line"></div>
                            <p className = "divider-text">
                                or use your account
                            </p>
                            <div className = "divider-line"></div>
                        </div>
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
                        <div className = "input-container">
                            {FaKey({ className: "input-icon" })}
                            <input
                                className = "login-input"
                                type = "password"
                                placeholder = "Password"
                                value = {password}
                                onChange = {(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button className = "forgot-password-button"
                            type = "button"
                        > Forgot your password?
                        </button>
                        {error && <p style={{color: 'red'}}>{error}</p>}
                        <button className = "enter-button"
                            type = "submit"
                            disabled = {loading}
                        >{loading ? "Signing In..." : "SIGN IN"}
                        </button>
                    </form>
                </div>


                <div className = "signup-container">
                    <form className = "signup-form"
                        onSubmit = {(e) => {e.preventDefault();
                                            signUp();}}
                    >
                        <h1>Create Account</h1>
                        <div className = "input-container">
                            {FaEnvelope({ className: "input-icon" })}
                            <input
                                className = "signup-input"
                                type = "email"
                                placeholder = "Email" 
                                value = {signupEmail}
                                onChange = {(e) => setSignupEmail(e.target.value)}       
                            />                     
                        </div>
                        <div className = "input-container">
                            {FaKey({ className: "input-icon" })}
                            <input
                            className = "signup-input"
                            type = "password"
                            placeholder = "Password" 
                            value = {signupPassword}
                            onChange = {(e) => setSignupPassword(e.target.value)}
                            />
                        </div>
                        <div className = "input-container">
                            {FaKey({ className: "input-icon" })}
                            <input
                            className = "signup-input"
                            type = "password"
                            placeholder = "Confirm Password"
                            value = {signupConfirmPassword}
                            onChange = {(e) => setSignupConfirmPassword(e.target.value)}
                            />
                        </div>
                        {signupError && <p style={{ color: "red" }}>{signupError}</p>}
                        <button className = "enter-button"
                            type = "submit"
                            disabled = {signupLoading}
                        >{signupLoading ? "Creating account..." : "SIGN UP"}
                        </button>
                    </form>
                </div>

                <div className = "overlay-container">
                    <div className = "overlay">
                        <div className = "overlay-panel overlay-left">
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p> 
                            <button className = "ghost-button"
                                type = "button"
                                onClick = {() => setIsActive(false)}
                            > {FaArrowLeft({ className: "arrow-icon" })} SIGN IN
                            </button>
                        </div>

                        <div className = "overlay-panel overlay-right">
                            <h1>Hello, Friend!</h1>
                            <p>Create an account and start your journey with us</p>
                            <button className = "ghost-button"
                                type = "button"
                                onClick = {() => setIsActive(true)}
                            > SIGN UP {FaArrowRight({ className: "arrow-icon"})} 
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


