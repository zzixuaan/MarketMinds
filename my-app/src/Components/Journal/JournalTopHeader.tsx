import "../../cssComponents/JournalTopHeader.css";
import { Link } from "react-router-dom";


function JournalTopHeader() {
    return (
        <div className="header-bottom">
            <div className="journal-text">
                <h2>Journal</h2>
                <p>Capture your trades. Reflect and Improve.</p>
            </div>

            <Link to="/journalentry" className="entry-button">
                + New Entry
            </Link>
        </div>

    )
}

export default JournalTopHeader;