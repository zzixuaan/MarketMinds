import { BASE_URL } from "../api";

export async function getMarketNews() {
    const response = await fetch(`${BASE_URL}/api/market-news`);

    if (!response.ok) {
        throw new Error("Failed to fetch market news.");
    }

    return response.json();
}