import Card from "./Card";

function AssetAllocationCard() {
    return (
        <Card>
            <h3>Asset Allocation</h3>
            <p>(insert the pie chart here)</p>

            <div className="Asset-Allocation">
                <span>Stocks</span>
            </div>

            <div className="Asset-Allocation">
                <span>ETFs</span>
            </div>

            <div className="Asset-Allocation">
                <span>Cash</span>
            </div>

            <div className="Asset-Allocation">
                <span>Others</span>
            </div>

        </Card>
    )
}

export default AssetAllocationCard;