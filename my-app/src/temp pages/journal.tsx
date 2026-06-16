import JournalTopHeader from "../Components/Journal/JournalTopHeader";
import JournalEntriesCard from "../Components/Journal/JournalEntriesCard";
import NavigationBar from "../Components/General/NavigationBar";
import TopHeader from "../Components/General/TopHeader";
import "../cssPages/Journal.css";

function Journal() {
    return (
        <div className="journal">
            <TopHeader />
            <JournalTopHeader />
            <JournalEntriesCard />

        </div>

    )
}

export default Journal;