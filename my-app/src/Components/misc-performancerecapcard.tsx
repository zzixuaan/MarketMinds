import Card from "./Card";
import "../cssComponents/JournalPerformanceRecapCard.css";


function JournalPerformanceRecapCard() {
    return (
        <div className= "journal-recap">
            <div className= "journal-recap-top">
                <h5> Performance Recap</h5>
                <button className="this-month"> This Month</button>
            </div>

            <div className= "journal-recap-dashboard">
                <div className= "journal-small">
                    <p>Total Trades</p>
                    <h2> insert number here</h2>
                    <p> (can insert comparison here)</p>
                </div>


                <div className= "journal-small">
                    <p>Win Rate</p>
                    <h2> insert number here</h2>
                    <p> (can insert comparison here)</p>
                </div>

                <div className= "journal-small">
                    <p>Average R Multiple</p>
                    <h2> insert number here</h2>
                    <p> (can insert comparison here)</p>
                </div>

                <div className= "journal-small">
                    <p>Net Result</p>
                    <h2> insert number here</h2>
                    <p> (can insert comparison here)</p>
                </div>
            </div>
        </div>
    )
}


export default JournalPerformanceRecapCard;