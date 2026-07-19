import "../../cssComponents/Home/DailyMessageCard.css";

interface DailyMessageCardProps {
    username?: string;
    dailyChange: number;
    tradeCount: number;
}

function DailyMessageCard({
    username,
    dailyChange,
    tradeCount
}: DailyMessageCardProps) {

    const displayName = username || "Trader";

    let title = "";
    let message = "";

    if (tradeCount === 0) {
        title = "Patience is part of trading 🧠";
        message =
            "No trades today. Sometimes the best decision is waiting " +
            "for the right opportunity instead of forcing a move.";
    }

    else if (tradeCount >= 8) {
        title = "Active session today";
        message = "You made several trades today. Remember to stay disciplined " +
                  "and avoid letting emotions drive your decisions.";
    }

    else if (dailyChange > 2) {
        title = "Excellent work today";
        message = "Your portfolio had a strong move today. " +
                  "Keep protecting your gains and stay focused on your strategy.";
    }

    else if (dailyChange > 0.5) {
        title = "Strong session today";
        message = "Your portfolio finished higher today. " +
                  "Consistent decisions are what build strong traders.";

    }

    else if (dailyChange > 0) {
        title = "Small wins add up";
        message = "A positive day is still progress. " +
                  "Keep learning and refining your approach.";

    }

    else if (dailyChange === 0) {
        title = "Waiting for the right moment";
        message = "The market was quiet today. " +
                  "Good traders know when to stay patient.";
    }

    else if (dailyChange > -1) {
        title = "A small setback today";
        message = "Not every session goes your way. " +
                  "Focus on your process and keep improving.";
    }

    else if (dailyChange > -2) {
        title = "Tough session today";
        message = "Markets can be unpredictable. Review your decisions " +
                  "and use today as a learning opportunity.";

    }

    else {
        title = "Challenging day";
        message = "Every trader experiences difficult sessions. " +
                  "Focus on learning and building better habits.";
    }


    return (
        <div className="daily-message-card">
            <h2>Welcome back, <span className="username-highlight">{displayName}</span> 👋</h2>
            <h3>{title}</h3>
            <p>{message}</p>
        </div>
    );
}


export default DailyMessageCard;