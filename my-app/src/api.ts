export const BASE_URL =
    process.env.REACT_APP_BACKEND_URL ||
    (window.location.hostname === "localhost"
        ? "http://localhost:8000"
        : "https://marketminds-i17q.onrender.com");