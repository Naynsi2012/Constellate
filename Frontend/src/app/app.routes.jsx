import { createBrowserRouter } from "react-router";

import Home from "../pages/Home";
import LandingPage from "../pages/LandingPage";
import Health from "../features/health/pages/Health";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Health />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
]);
