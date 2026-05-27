import logo from "../Pictures/Market_Minds_Logo_transparent.png";
import "../cssComponents/JournalTopHeader.css";


function JournalTopHeader() {
    return (
        <div className="top-header">
            <div className="header-top">
                <img src={logo} alt="Logo" className="logo"/>

                <button className="notification-button">
                    Notifications
                </button>
            </div>

            <div className="header-bottom">
                <div className="journal-text">
                    <h2>Journal</h2>
                    <p>Capture your trades. Reflect and Improve.</p>
                </div>

                <button className="entry-button">
                    + New Entry
                </button>
            </div>
        </div>

    )
}

export default JournalTopHeader;