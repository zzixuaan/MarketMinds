import "../../cssComponents/NavigationBar.css";
import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav className="navigation-bar">
            <Link to = "/home">Home</Link>
            <Link to ="/portfolio">Portfolio</Link>
            <Link to ="/trade">Trade</Link>
            <Link to ="/journal">Journal</Link>
            <Link to = "/profile">Profile</Link>
            <Link to = "/teams">Teams</Link>
        </nav>
    )
}

export default NavigationBar;
