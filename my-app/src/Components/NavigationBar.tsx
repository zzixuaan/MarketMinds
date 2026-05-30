import "../cssComponents/NavigationBar.css";
import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav className="navigation-bar">
            <a href="#">Home</a>
            <a href="#">Portfolio</a>
            <a href="#">Trade</a>
            <a href="#">Journal</a>
            <Link to = "/profile">Profile</Link>
        </nav>
    )
}

export default NavigationBar;
