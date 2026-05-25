// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4sgmcf-OJ4QSrNazohS6Qa8R9tpK2V-g",
  authDomain: "marketminds-e86aa.firebaseapp.com",
  projectId: "marketminds-e86aa",
  storageBucket: "marketminds-e86aa.firebasestorage.app",
  messagingSenderId: "350267843783",
  appId: "1:350267843783:web:241d0dafb65ab60e960ae2",
  measurementId: "G-J77C6JD64G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth };
export { googleProvider };
