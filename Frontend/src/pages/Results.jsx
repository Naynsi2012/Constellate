import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { getResults, exportUrl } from "../features/rooms/api";

const Results = () => {
  const { roomId } = useParams();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getResults(roomId)
      .then(({ data }) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.error ?? err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-semibold">
            No results for this room
          </h1>
          <p className="mb-4 opacity-70">{error}</p>
          <Link
            to="/"
            className="rounded bg-white px-3 py-2 font-medium text-slate-900"
          >
            Back to start
          </Link>
        </div>
      </main>
    );
  }

  if (!results) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <p className="opacity-70">Loading results…</p>
      </main>
    );
  }

  const maxNoteVotes = Math.max(1, ...results.topNotes.map((n) => n.votes));
  const maxClusterVotes = Math.max(
    1,
    ...results.topClusters.map((c) => c.votes),
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold tracking-widest text-indigo-300">
          SESSION RESULTS
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {results.question || `Room ${results.roomId}`}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {results.totals.participants} participant(s) · {results.totals.notes}{" "}
          ideas · {results.totals.clusters} cluster(s) · {results.totals.votes}{" "}
          votes
        </p>

        {results.topClusters.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold tracking-widest text-slate-300">
              TOP CLUSTERS
            </h2>
            <ol className="flex flex-col gap-2">
              {results.topClusters.map((cluster, i) => (
                <li
                  key={cluster.id}
                  className="rounded-lg border border-white/10 bg-slate-900/70 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {i + 1}. {cluster.name}
                    </span>
                    <span className="text-sm text-amber-300">
                      {cluster.votes} vote(s)
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(cluster.votes / maxClusterVotes) * 100}%`,
                        background: cluster.color ?? "#7aa2ff",
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {cluster.noteCount} note(s)
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold tracking-widest text-slate-300">
            TOP IDEAS
          </h2>
          {results.topNotes.length === 0 && (
            <p className="text-sm text-slate-500">No ideas were captured.</p>
          )}
          <ol className="flex flex-col gap-2">
            {results.topNotes.map((note, i) => (
              <li
                key={note.id}
                className="rounded-lg border border-white/10 bg-slate-900/70 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex items-start gap-2">
                    <span className="mt-0.5 text-slate-500">{i + 1}.</span>
                    <span
                      className="rounded px-2 py-0.5 text-sm font-medium text-slate-900"
                      style={{ background: note.color }}
                    >
                      {note.text}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-amber-300">
                    {note.votes} vote(s)
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10">
                  <div
                    className="h-full rounded bg-amber-300"
                    style={{ width: `${(note.votes / maxNoteVotes) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {note.author ? `by ${note.author}` : "anonymous"}
                  {note.cluster ? ` · ${note.cluster}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={exportUrl(roomId)}
            download
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
          >
            Export Markdown
          </a>
          <Link
            to={`/room/${roomId}`}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20"
          >
            Back to board
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Results;
