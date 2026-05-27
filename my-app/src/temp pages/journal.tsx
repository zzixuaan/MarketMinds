import JournalTopHeader from "../Components/JournalTopHeader";
import JournalEntriesCard from "../Components/JournalEntriesCard";
import "../cssPages/Journal.css";

function Journal() {
    return (
        <div className="journal">
            <JournalTopHeader />
            <JournalEntriesCard />

        </div>

    )
}

export default Journal;