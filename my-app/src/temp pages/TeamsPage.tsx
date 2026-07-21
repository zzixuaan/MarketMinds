import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    createTeam,
    getMyTeams,
    Team,
} from "../services/teamApi";

import "../cssPages/TeamsPage.css";
import TopHeader from "../Components/General/TopHeader";

function TeamsPage() {
    const navigate = useNavigate();

    const [teams, setTeams] = useState<Team[]>([]);
    const [teamName, setTeamName] = useState("");
    const [message, setMessage] = useState("");

    async function loadTeams() {
        try {
            const data = await getMyTeams();
            setTeams(data);
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    :"Unable to load item"
            );
        }
    }

    useEffect(() => {
        loadTeams();
    }, []);

    async function handleCreateTeam(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setMessage("");
        
        if (!teamName.trim()) {
            setMessage("Please enter a team name.");
            return;
        }

        try {
            const newTeam = await createTeam(teamName);
            setTeamName("");
            navigate(`/teams/${newTeam.id}`);

        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Unable to create team."
            );
        }
    }

    return (
        <main className="teamspage">
            <TopHeader/>
            <div className="teams-page">
                <h1>Teams</h1>

                {message && <p>{message}</p>}

                <form className="team-form" onSubmit={handleCreateTeam}>
                    <input
                        type="text"
                        value={teamName}
                        onChange={(event) => 
                            setTeamName(event.target.value)
                        }
                        placeholder="Team name"
                    />

                    <button type="submit">
                        Create Team
                    </button>
                </form>

                <section className="team-section">
                    <h2> My Teams </h2>

                    <div className="team-list">
                        {teams.map((team) => (
                            <button
                                key={team.id}
                                type="button"
                                className="team-card"
                                onClick={() => navigate(`/teams/${team.id}`)}
                            >
            
                                <h2>{team.name}</h2>

                                <p>
                                    {team.members.length}{" "}
                                    {team.members.length === 1 ? "member" : "members"}
                                </p>
                            </button>
                        ))}
                    </div>
    
                </section>
            </div>
        </main>
    )
    
}

export default TeamsPage;