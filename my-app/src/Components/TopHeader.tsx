import logo from "../Pictures/Market Minds Logo.jpg";
import "../cssComponents/TopHeader.css";


function TopHeader() {
    return (
        <div className="top-header">
            <div className="header-top">
                <img src={logo} alt="Logo" className="logo"/>

                <button className="notification-button">
                    Notifications
                </button>
            </div>

            <div className="header-bottom">
                <div className="welcome-text">
                    <h2>Hello User!</h2>
                    <p>Here is your portfolio overview</p>
                </div>

                <div className="power-card">
                    <h3>Virtual Purchasing Power:</h3>
                    <p>(insert portfolio value here)</p>
                </div>
            </div>
        </div>

    )
}

export default TopHeader;