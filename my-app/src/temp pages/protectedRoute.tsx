import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

import { auth, database } from "../firebase-config";
import { doc, getDoc } from "firebase/firestore";

export const ProtectedRoute = ({ children } : any) => {
    const [loading, setLoading] = useState(true);
    const [userState, setUserState] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const user = auth.currentUser;
            if (!user) {
                setUserState(null);
                setLoading(false);
                return;
            }

            const userRef = doc(database, "users", user.uid);
            const userSnap = await getDoc(userRef);

            setUserState({ authUser: user, profile: userSnap.exists()? userSnap.data(): null });
            setLoading(false);
        };

        checkUser();
    }, []);

    if (loading) return <p>Loading...</p>

    if (!userState?.authUser) {
        return <Navigate to="/" />
    }

    if (!userState.profile?.onboardingComplete) {
        return <Navigate to="/onboarding" />
    }

    return children;

}