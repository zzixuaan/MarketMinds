import { getAuthToken } from "./journalApi";

import { BASE_URL } from "../api";

export interface Team {
    id: string;
    name: string;
    ownerId: string;
    members: string[];
    memberNames: Record<string, string>;

}

export interface LeaderboardRow {
    rank: number;
    userId: string;
    displayName: string;
    returnPercent: number;
}

async function getErrorMessage(response: Response): Promise<string> {
    try {
        const data = await response.json();

        if (typeof data.detail === "string") {
            return data.detail;
        }

    } catch {

    }

    return "Request failed.";
}

export async function createTeam(name: string): Promise<Team> {
    const token = await getAuthToken();   
    
    console.log("sending create team body:", { name });

    const response = await fetch(`${BASE_URL}/api/teams`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
    });

    if (!response.ok) {
        let data: any = null;

        try {
            data = await response.json();
        } catch {

        }
        throw new Error(await getErrorMessage(response));
    }

    return response.json();
}

export async function getMyTeams(): Promise<Team[]> {
    const token = await getAuthToken();    

    const response = await fetch(`${BASE_URL}/api/teams`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json();
}

export async function getTeam(teamId: string): Promise<Team> {
    const token = await getAuthToken();    

    const response = await fetch(`${BASE_URL}/api/teams/${teamId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json();
}

export async function addTeamMember(
    teamId: string,
    memberId: string,
    displayName: string
): Promise<Team> {
    const token = await getAuthToken();

    const response = await fetch(`${BASE_URL}/api/teams/${teamId}/members`, 
        {method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                memberId,
                displayName,
            }),

        }

    );

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json();
}

export async function getTeamLeaderboard(
    teamId: string
): Promise<LeaderboardRow[]> {
    const token = await getAuthToken();    

    const response = await fetch(`${BASE_URL}/api/teams/${teamId}/leaderboard`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(await getErrorMessage(response));
    }

    return response.json();

}