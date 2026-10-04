import { Link, useRouteError } from "react-router";

const RouteError = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <main className="max-w-120 my-16 mx-auto py-0 px-4">
      <h2>Somethign went wrong</h2>
      <p>{error?.statusText || error?.message || "Unexpected error"}</p>
      <Link to="/">Back to start</Link>
    </main>
  );
};

export default RouteError;
