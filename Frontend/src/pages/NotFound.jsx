import { Link } from "react-router";

const NotFound = () => {
  return (
    <main className="max-w-120 my-16 mx-auto py-0 px-4">
      <h2>Page not found</h2>
      <p>That link doesn't lead anywhere.</p>
      <Link to="/">Back to start</Link>
    </main>
  );
};

export default NotFound;
