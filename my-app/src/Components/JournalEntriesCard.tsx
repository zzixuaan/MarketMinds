import "../cssComponents/JournalEntriesCard.css"

function JournalEntriesCard() {
    return (
        <div className= "journal-entries">
            <div className= "journal-entries-header">
                <h3>Recent Journal Entries</h3>
                <button className= "view-all-button">View all</button>
            </div>

            <div className="logs">                   
                <p>(date)</p>
                <p>(company logo, company, long/short)</p>
                <p>(price change)</p>
                <p>(win/loss)</p>
            </div>
        </div>

    )
}


export default JournalEntriesCard;