import logo from "../../Pictures/Market_Minds_Logo_v3.png";
import "../../cssComponents/TopHeader.css";
import NavigationBar from "./NavigationBar";


function TopHeader() {
    return (
        <div className="top-header">
            <div className="header-top">
                <img src={logo} alt="Logo" className="logo"/>

                <button className="notification-button">
                    Notifications
                </button>
            </div>

            <NavigationBar />

        </div>

    )
}

export default TopHeader;