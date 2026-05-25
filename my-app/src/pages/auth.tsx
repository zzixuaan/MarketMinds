import { auth, googleProvider } from '../firebase-config';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'

export const AUTH = () => {
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");


   const [error, setError] = useState("");
   const [loading, setLoading] = useState(false);


   const navigate = useNavigate();


   const signIn = async () => {
       try {
           setLoading(true);
           setError("");
          
           await signInWithEmailAndPassword(auth, email, password);


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
       } catch (err: any) {
           setError("Google sign-in failed.");
       } finally {
           setLoading(false);
       }
   }
  
   return (
       <div>
           <h1>Login</h1>
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
           <button
               onClick = {signIn}
               disabled = {loading}
           >{loading ? "Signing In..." : "Sign In"}
           </button>
           <br />
           <br />
           <button
               onClick = {signInWithGoogle}
               disabled = {loading}
           >{loading ? "Signing In..." : "Sign in with Google"}
           </button>
           <br />
           <br />
           {error && <p style={{color: 'red'}}>{error}</p>}
           <p> Don't have an account yet?{" "}
               <button onClick={() => navigate("/signup")}>
                   Sign Up
               </button>
           </p>
       </div>
   );
}
