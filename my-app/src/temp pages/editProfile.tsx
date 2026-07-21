import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { auth, database } from "../firebase-config";
import { doc, getDoc, updateDoc } from "firebase/firestore";

import TopHeader from "../Components/General/TopHeader";

import "../cssPages/editProfile.css";
import "../cssPages/profile.css";

export const EditProfile = () => {
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const user = auth.currentUser;
    const navigate = useNavigate();

    useEffect (() => {
        const fetchProfile = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            const userRef = doc(database, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();

                setUsername(userData.username || "");
                setBio(userData.bio || "");
            }
            setLoading(false);
        };
        fetchProfile();
    }, [user]);

    const handleSave = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setSaving(true);
            const userRef = doc(database, "users", user.uid);
            await updateDoc(userRef, {username, bio});

            navigate("/profile");
        } catch (error) {
            console.error("Failed to update profile.", error);
            alert("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <p>Loading profile...</p>
            </div>
        );
    }

    return (
        <div className = "profile-page">
            <div className = "edit-profile-container">
                <div className = "edit-profile-card">
                    <h1 className = "edit-profile-title">Edit Profile</h1>
                    <div className = "edit-profile-section">
                        <label>Username</label>
                        <input 
                            className = "edit-input"
                            type = "text"
                            value = {username}
                            onChange = {(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className = "edit-profile-section">
                        <label>Bio</label>
                        <textarea 
                            className = "edit-textarea"
                            value = {bio}
                            onChange = {(e) => setBio(e.target.value)}
                            maxLength = {150}
                            placeholder = "Tell others a little about yourself..."
                        />
                        <div className = "bio-count">
                            {bio.length}/150
                        </div>
                        <div className = "enter-buttons">
                            <button 
                                className = "cancel-button"
                                onClick = {() => navigate("/profile")}
                            >
                                Cancel
                            </button>
                            <button
                                className = "save-button"
                                onClick = {handleSave}
                                disabled = {saving}
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}