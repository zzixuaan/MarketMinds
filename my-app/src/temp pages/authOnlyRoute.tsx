import { auth, database } from "../firebase-config";
import { Navigate } from "react-router-dom";

const AuthOnlyRoute = ({children} : any) => {
    const user = auth.currentUser;

    if (!user) {
        return <Navigate to="/" />;
    }

    return children;
}
