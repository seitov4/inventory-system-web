import LandingPage from "./pages/LandingPage/LandingPage";
import LoginPage from "./pages/Login/LoginPage";

export const routes = [
    { path: "/", element: <LandingPage /> },
    { path: "/login", element: <LoginPage /> },

    // дальше будут приватные страницы
];
