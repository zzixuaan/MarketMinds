import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    addTeamMember,
    getTeam,
    getTeamLeaderboard,
    LeaderboardRow,
    Team,
} from "../services/teamApi";
import "../cssPages/TeamsPage.css";
import TopHeader from "../Components/General/TopHeader";

function TeamPage() {
    const { teamId } = useParams();

    const [team, setTeam] = useState<Team | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
    const [memberId, setMemberId] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [message, setMessage] = useState("");

    async function loadTeamData() {
        if (!teamId) {
            setMessage("Team ID is missing.");
            return;
        }

        setMessage("");

        try {
            const teamData = await getTeam(teamId);
            setTeam(teamData);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    :"Unable to load team."
            );

            return;
        }

        try {
            const leaderboardData = await getTeamLeaderboard(teamId);
            setLeaderboard(leaderboardData);
        } catch (error) {
            setMessage(
                error instanceof Error 
                    ? error.message
                    :"Unable to load leaderboard."
            );
        }
    }

    useEffect(() => {
        loadTeamData();
    }, [teamId]);

    async function handleAddMember(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!teamId) {
            return;
        }

        if (!memberId.trim()) {
            setMessage("Please enter the member's Firebase UID.");
            return;
        }

        try {
            await addTeamMember(
                teamId,
                memberId,
                displayName
            );

            setMemberId("");
            setDisplayName("");
            await loadTeamData();
        } catch (error) {
            setMessage(
                error instanceof Error 
                    ? error.message
                    :"Unable to add member."
            );
        }
    }


    return (
        <main className="teamspage">
            <TopHeader/>
            
            <div className="team-page">
                <h1>{team?.name ?? "Team"}</h1>
                {message && <p>{message}</p>}

                <section className="team-section">
                    <h2>Add member</h2>

                    <form className="team-form" onSubmit={handleAddMember}>
                        <input
                            type="text"
                            value={memberId}
                            onChange={(event) =>
                                setMemberId(event.target.value)
                            }
                            placeholder="Firebase UID"
                        />

                        <input
                            type="text"
                            value={displayName}
                            onChange={(event) =>
                                setDisplayName(event.target.value)
                            }
                            placeholder="Display name"
                        />

                        <button type="submit">
                            Add Member
                        </button>
                    </form>
                </section>

                <section className="team-section">
                    <h2>Leaderboard</h2>

                    <div className="leaderboard-table-wrapper">

                        <table className="leaderboard-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Trader</th>
                                    <th>Return %</th>
                                </tr>
                            </thead>

                            <tbody>
                                {leaderboard.map((row) => (
                                    <tr key={row.userId}>
                                        <td>#{row.rank}</td>
                                        <td>{row.displayName}</td>
                                        <td>{row.returnPercent}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default TeamPage;