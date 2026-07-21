import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import { auth, database } from "../firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import TopHeader from "../Components/General/TopHeader";
import "../cssPages/profile.css";

interface UserData {
    username: string,
    email: string,
    createdAt: any,
    onboardingComplete: boolean,
    bio: string,
    photoURL: string
}

export const Profile = () => {
    const user = auth.currentUser;
    const [userData, setUserData] = useState<UserData | null>(null);
    
    const navigate = useNavigate()

    useEffect(() => {
        const fetchUser = async () => {
            if (!user) return;

            const userRef = doc(database, "users", user.uid);
            const snap = await getDoc(userRef);

            if (snap.exists()) {
                const data = snap.data() as UserData              
                const updates: Partial<UserData> = {};

                if (data.bio === undefined) {
                    updates.bio = "";
                    data.bio = "";
                }

                if (data.photoURL === undefined) {
                    updates.photoURL = "";
                    data.photoURL = "";
                }

                if (Object.keys(updates).length > 0) {
                    await updateDoc(userRef, updates);
                }

                setUserData(data);
            }
        };
        fetchUser();
    }, [user]);

    const joined = userData?.createdAt.toDate
        ? userData.createdAt.toDate().toLocaleDateString("en-SG", {
            month: "long",
            year: "numeric",
        })
        : "";

    return (
        <div className = "profile-page">
            <TopHeader />
            <div className = "profile-card">
                <div className = "profile-info">
                    <div className="profile-avatar">
                        {userData?.photoURL ? (
                            <img
                                src={userData.photoURL}
                                alt="Profile"
                                className="profile-avatar-image"
                            />
                        ) : (
                            (userData?.username?.charAt(0) ||
                                user?.displayName?.charAt(0) ||
                                user?.email?.charAt(0) ||
                                "T"
                            ).toUpperCase()
                        )}
                    </div>
                    <div className = "profile-details">
                        <h1>
                            {userData?.username ||
                                user?.displayName ||
                                "Trader"}
                        </h1>
                        <p className="profile-uid">
                            <strong>UID:</strong> {user?.uid}
                        </p>
                        <p>{user?.email}</p>
                        <p className = "profile-bio">{userData?.bio}</p>
                        <span>Member since {joined}</span>
                    </div>
                </div>
                <button 
                    className = "edit-profile-button"
                    onClick = {() => navigate("/profile/edit")}
                >
                    Edit Profile
                </button>
            </div>
        </div>
    );
};