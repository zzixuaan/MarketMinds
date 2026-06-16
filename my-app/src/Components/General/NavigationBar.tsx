import "../../cssComponents/NavigationBar.css";
import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav className="navigation-bar">
            <Link to = "/home">Home</Link>
            <a href="#">Portfolio</a>
            <a href="#">Trade</a>
            <Link to ="/journal">Journal</Link>
            <Link to = "/profile">Profile</Link>
        </nav>
    )
}

export default NavigationBar;
