import logo from "../Pictures/Market_Minds_Logo_transparent.png";
import "../cssComponents/TopHeader.css";
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

            <div className="header-bottom">
                <div className="welcome-text">
                    <h2>Hello User!</h2>
                    <p>Here is your portfolio overview</p>
                </div>

                <div className="power-card">
                    <h4>Virtual Purchasing Power:</h4>
                    <p>(insert portfolio value here)</p>
                </div>
            </div>
        </div>

    )
}

export default TopHeader;