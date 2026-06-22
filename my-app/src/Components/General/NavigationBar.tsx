import "../../cssComponents/NavigationBar.css";
import { Link } from "react-router-dom";

function NavigationBar() {
    return (
        <nav className="navigation-bar">
            <Link to = "/home">Home</Link>
            <a href="#">Portfolio</a>
            <Link to ="/trade">Trade</Link>
            <Link to ="/journal">Journal</Link>
            <Link to = "/profile">Profile</Link>
        </nav>
    )
}

export default NavigationBar;
