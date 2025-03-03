import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorPage from "./pages/ErrorPage";

import Home from "./pages/Home";
import TrackdayInfo from "./pages/TrackdayInfo";
import Rules from "./pages/Rules";
import Faq from "./pages/Faq";
import Shop from "./pages/Shop";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import PasswordReset from "./pages/PasswordReset";

import Construction from "./pages/Construction";
const underConstruction = false; // Used to hide website content, routes accessible unless commented out

const Router = () => {
	const router = createBrowserRouter([
		{
			path: "/",
			element: <App />,
			errorElement: <ErrorPage />,
			children: [
				{ index: true, element: underConstruction? <Construction /> : <Home/> },
				{ path: "/home", element: <Home /> },
				{ path: "/info", element: <TrackdayInfo /> },
				{ path: "/rules", element: <Rules /> },
				{ path: "/faq", element: <Faq /> },
				{ path: "/shop", element: <Shop /> },
				{ path: "/dashboard/*", element: <Dashboard /> },
				{ path: "/QR/*", element: <Dashboard /> },
				{ path: "/register", element: <Register /> },
				{ path: "/passwordreset/:userID/:token", element: <PasswordReset/> },
			],
		},
	]);

	return <RouterProvider router={router} />;
};

export default Router;