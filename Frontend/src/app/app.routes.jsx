import { createBrowserRouter, Outlet } from "react-router";

import LandingPage from "../pages/LandingPage";
import Health from "../features/health/pages/Health";
import RouteError from "../pages/RouteError";
import Board from "../pages/Board";
import Results from "../pages/Results";
import NotFound from "../pages/NotFound";

function AppLayout() {
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "/health", element: <Health /> },
      { path: "/room/:roomId", element: <Board /> },
      { path: "/room/:roomId/results", element: <Results /> },
      { path: "*", element: <NotFound /> }
    ]
  },
]);
