import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import ErrorPage from "./pages/ErrorPage";

import Home from "./pages/Home";
import Dates from "./pages/Dates";
import Rules from "./pages/Rules";
import Faq from "./pages/Faq";
import Shop from "./pages/Shop";
import Dashboard from "./pages/Dashboard";

const Router = () => {
    const router = createBrowserRouter([
      {
        path: "/",
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
          { index: true,        element: <Home /> },
          { path: "/dates",     element: <Dates /> },
          { path: "/rules",     element: <Rules /> },
          { path: "/faq",       element: <Faq /> },
          { path: "/shop",      element: <Shop /> },
          { path: "/dashboard", element: <Dashboard /> },
        ],
      },
    ]);
  
    return <RouterProvider router={router} />;
  };
  
  export default Router;