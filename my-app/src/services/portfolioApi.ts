import { auth } from "../firebase-config";
import { BASE_URL } from "../api";

export async function getPortfolio() {
    const user = auth.currentUser;

    if (!user) {
        throw new Error("Not logged in");
    }

    const token = await user.getIdToken();

    const [portfolioRes, historyRes] = await Promise.all([
        fetch(`${BASE_URL}/api/portfolio`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
        fetch(`${BASE_URL}/api/portfolio/history`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }),
    ]);

    if (!portfolioRes.ok) {
        throw new Error(
            `Portfolio request failed (${portfolioRes.status})`
        );
    }

    if (!historyRes.ok) {
        throw new Error(
            `Portfolio history request failed (${historyRes.status})`
        );
    }

    const portfolio = await portfolioRes.json();
    const history = await historyRes.json();

    return {
        portfolio,
        history,
    };
}