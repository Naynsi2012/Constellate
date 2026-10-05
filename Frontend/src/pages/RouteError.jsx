import { Link, useRouteError } from "react-router";

const RouteError = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <main className="mx-auto my-16 max-w-120 px-4 py-0">
      <h2>Something went wrong</h2>
      <p>{error?.statusText || error?.message || "Unexpected error"}</p>
      <Link to="/">Back to start</Link>
    </main>
  );
};

export default RouteError;
