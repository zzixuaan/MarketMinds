import { auth } from "../firebase-config";
import NavigationBar from "../Components/General/NavigationBar";

export const Profile = () => {
    const user = auth.currentUser;
    
    return (
        <div>
            <h1>Profile</h1>
            <p>Email: {user?.email}</p>
            <p>UID: {user?.uid}</p>
        </div>
    )
}

