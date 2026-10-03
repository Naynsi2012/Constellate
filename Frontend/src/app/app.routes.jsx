import { createBrowserRouter } from "react-router";

import Home from "../pages/Home";
import LandingPage from "../pages/LandingPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
]);
