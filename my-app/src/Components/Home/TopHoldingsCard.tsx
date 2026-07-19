import "../../cssComponents/Home/TopHoldings.css";
import { useEffect, useState } from "react";
import { auth } from "../../firebase-config";

const BACKEND_URL =
    process.env.REACT_APP_BACKEND_URL ||
    (window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://marketminds-i17q.onrender.com");

interface Holding {
    id: string;
    symbol: string;
    quantity: number;
    averageCost: number;
    currentPrice: number;
    marketValue: number;
}


async function getTopHoldings(): Promise<Holding[]> {
    const user = auth.currentUser;

     if (!user) {
    throw new Error("You must be logged in.");
  }

  const token = await user.getIdToken();

  const response = await fetch(
    `${BACKEND_URL}/api/holdings/top`,
    {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`,
        },
    },
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(
        data.detail ||
        data.message ||
        "Unable to load holdings.",
    );
  }

    return Array.isArray(data) ? data : [];
}



function TopHoldingsCard() {
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadTopHoldings() {
            try {
                setIsLoading(true);
                setError("");

                const data = await getTopHoldings();
                setHoldings(data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load holdings.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadTopHoldings();
    }, []);

    return (
        <section className="top-holdings-card">
            <div className="top-holdings-header">
                <h3>Top Holdings</h3>
            </div>

            {isLoading ? (
                <p className="holdings-message">Loading holdings...</p>
            ) : error ? (
                <p className="holdings-error">{error}</p>
            ) : holdings.length === 0 ? (
                <p className="holdings-message">
                No holdings available.
                </p>
            ) : (
                <div className="top-holdings-list">
                {holdings.map((holding) => {
            
                    return (
                        <article
                            className="top-holding-row"
                            key={holding.id}
                        >
                            <div className="holding-symbol">
                                <strong>{holding.symbol}</strong>
                                <span>{holding.quantity} shares</span>
                            </div>

                            <div className="holding-price">
                                <strong>
                                    ${holding.currentPrice.toFixed(2)}
                                </strong>
                                <span>
                                    Avg. ${holding.averageCost.toFixed(2)}
                                </span>
                            </div>

                            <div className="holding-value">
                                <strong>
                                    ${holding.marketValue.toFixed(2)}
                                </strong>
                            </div>
                        </article>
                    );
                })}
                </div>
            )}
        </section>
    );
}

export default TopHoldingsCard;
