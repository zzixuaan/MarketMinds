import "../../cssComponents/HomeHeader.css";

function HomeHeader() {
    return (
        <div className="home-header-bottom">
            <div className="welcome-text">
                <h2>Hello User!</h2>
                <p>Here is your portfolio overview</p>
            </div>

            <div className="power-card">
                <h4>Virtual Purchasing Power:</h4>
                <p>(insert portfolio value here)</p>
            </div>
        </div>
    );
}

export default HomeHeader;