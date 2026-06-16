import TopHeader from "../Components/General/TopHeader";
import PortfolioSummaryCard from "../Components/Home/PortfolioSummaryCard";
import KeyMetricsCard from "../Components/Home/KeyMetricsCard";
import AssetAllocationCard from "../Components/Home/AssetAllocationCard";
import TopHoldingsCard from "../Components/Home/TopHoldingsCard";
import RecentTradesCard from "../Components/Home/RecentTradesCard";
import HomeHeader from "../Components/Home/HomeHeader";
import "../cssPages/HomePage.css";

function HomePage() {
    return (
        <div className= "home">
            <TopHeader />
            <HomeHeader />
            <PortfolioSummaryCard />
            <div className="dashboard">
                <KeyMetricsCard />
                <AssetAllocationCard />
                <TopHoldingsCard />
                <RecentTradesCard />
            </div>
        </div>
    )
}

export default HomePage