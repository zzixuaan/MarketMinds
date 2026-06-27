import TopHeader from "../Components/General/TopHeader";
import PortfolioSummaryCard from "../Components/Home/PortfolioSummaryCard";
import KeyMetricsCard from "../Components/Home/KeyMetricsCard";
import AssetAllocationCard from "../Components/Home/AssetAllocationCard";
import TopHoldingsCard from "../Components/Home/TopHoldingsCard";
import RecentTradesCard from "../Components/Home/RecentTradesCard";
import HomeHeader from "../Components/Home/HomeHeader";
import "../cssPages/HomePage.css";

import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase-config";

import {
  getTradeEntries,
} from "../services/tradeApi";

import type {
  TradeEntry,
} from "../services/tradeApi";


function HomePage() {

    const navigate = useNavigate();
    const [entries, setEntries] = useState<TradeEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                if (!user) {
                    setError("Please log in to view your trades.");
                    setIsLoading(false);
                    return;
                }

                try {
                    setError("");

                    const tradeEntries = await getTradeEntries();
                    setEntries(tradeEntries);

                } catch (error) {
                    setError(
                        error instanceof Error
                            ? error.message
                            : "Unable to load trade entries."
                    );

                } finally {
                    setIsLoading(false);
                }
            }
        );
        return unsubscribe;
    }, []);

     const recentEntries = entries.map((entry) => ({
        id: entry.id,
        date: entry.createdAt || new Date().toISOString(),
        symbol: entry.symbol,
        side: entry.side,
        price: entry.price,
        total: entry.total,
        quantity: entry.quantity,
    }));


    return (
        <div className= "home">
            <TopHeader />
            <HomeHeader />
            <PortfolioSummaryCard />
            <KeyMetricsCard />
            <div className="dashboard">
                <TopHoldingsCard />
                <RecentTradesCard
                 entries={recentEntries}
                 onViewAll={() => navigate("/journalviewallpage")}
                />
            </div>
        </div>
    )
}

export default HomePage