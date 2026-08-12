import logo from "../../Pictures/Market_Minds_Logo_v3.png";
import "../../cssComponents/TopHeader.css";
import NavigationBar from "./NavigationBar";

import { signOut } from "firebase/auth";
import { auth } from "../../firebase-config";
import { useNavigate } from "react-router-dom";


function TopHeader() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="top-header">
            <div className="header-top">
                <img src={logo} alt="Logo" className="logo"/>

                <div className="header-actions">
                    <button className="notification-button">
                        Notifications
                    </button>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            <NavigationBar />
        </div>
    );
}

export default TopHeader;