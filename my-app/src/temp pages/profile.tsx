import { auth } from "../firebase-config";
import NavigationBar from "../Components/General/NavigationBar";

export const Profile = () => {
    const user = auth.currentUser;
    
    return (
        <div className = "profile-page">
            <div className = "profile-sidebar">
                <div className = "profile-card">
                    
                </div>
            </div>
        </div>
        // <div>
        //     <h1>Profile</h1>
        //     <p>Email: {user?.email}</p>
        //     <p>UID: {user?.uid}</p>
        // </div>
    );
}

