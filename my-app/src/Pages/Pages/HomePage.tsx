import NavigationBar from "../../Components/NavigationBar";
import TopHeader from "../../Components/TopHeader";
import PortfolioSummaryCard from "../../Components/PortfolioSummaryCard";
import KeyMetricsCard from "../../Components/KeyMetricsCard";
import AssetAllocationCard from "../../Components/AssetAllocationCard";
import TopHoldingsCard from "../../Components/TopHoldingsCard";
import RecentTradesCard from "../../Components/RecentTradesCard";
import "../../cssPages/HomePage.css"


function HomePage() {
    return (
        <div>
            <TopHeader />
            <PortfolioSummaryCard />
            <div className="dashboard">
                <KeyMetricsCard />
                <AssetAllocationCard />
                <TopHoldingsCard />
                <RecentTradesCard />
            </div>
            <NavigationBar />
        </div>
    )
}

export default HomePage