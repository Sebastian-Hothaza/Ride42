import { createBrowserRouter, RouterProvider, useOutletContext } from "react-router-dom";
import App from "./App";
import ErrorPage from "./pages/ErrorPage";

import Home from "./pages/Home";
import TrackdayInfo from "./pages/TrackdayInfo";
import Rules from "./pages/Rules";
import Faq from "./pages/Faq";
import ShopTires from "./pages/ShopTires";
// import ShopGear from "./pages/ShopGear";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import PasswordReset from "./pages/PasswordReset";
import Waiver from "./pages/Waiver";

const API_SERVER = import.meta.env.VITE_API_SERVER;


import Construction from "./pages/Construction";
const underConstruction = false; // Used to hide website content, routes accessible unless commented out

const Router = () => {
	const router = createBrowserRouter([
		{
			path: "/",
			element: <App APIServer={API_SERVER}/>,
			errorElement: <ErrorPage />,
			children: [
				{ index: true, element: underConstruction? <Construction /> : <Home/> },
				{ path: "/home", element: <Home /> },
				{ path: "/info", element: <TrackdayInfo /> },
				{ path: "/rules", element: <Rules /> },
				{ path: "/faq", element: <Faq /> },
				{ path: "/shoptires", element: <ShopTires APIServer={API_SERVER}/> },
				// { path: "/shopgear", element: <ShopGear /> },
				{ path: "/dashboard/*", element: <Dashboard /> },
				{ path: "/QR/*", element: <Dashboard /> },
				{ path: "/register", element: <Register /> },
				{ path: "/passwordreset/:userID/:token", element: <PasswordReset/> },
				{ path: "/waiver", element: <Waiver/> },
			],
		},
	]);

	return <RouterProvider router={router} />;
};

export default Router;