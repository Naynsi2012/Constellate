
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { getResults, downloadExport } from "../features/rooms/api";

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M5 12h14" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="m7 10 5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function LoadingResults() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-ink">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl border border-line bg-surface-raised">
          <span className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" />
        </div>
        <h1 className="text-lg font-semibold">Gathering your results</h1>
        <p className="mt-2 text-sm text-dim">
          Preparing the highlights from your session...
        </p>
      </div>
    </main>
  );
}

function ErrorResults({ error, roomId }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-10 text-ink">
      <section className="panel w-full max-w-md p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl border border-danger/20 bg-danger/10 text-danger">
          <svg
            viewBox="0 0 24 24"
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-faint">
          Session results
        </p>
        <h1 className="mt-2 text-xl font-semibold">
          Could not load results
        </h1>
        <p className="mt-2 break-words text-sm leading-6 text-dim">
          {error || "Something went wrong while loading this session."}
        </p>

        <Link
          to={`/room/${roomId}`}
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong"
        >
          <ArrowLeftIcon />
          Back to board
        </Link>
      </section>
    </main>
  );
}

function StatCard({ label, value, detail }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface/80 p-3 sm:p-4">
      <p className="text-xs font-medium text-dim">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums sm:text-3xl">
        {value}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-faint">{detail}</p>
      )}
    </div>
  );
}

function VoteBar({ votes, maxVotes, color }) {
  const percentage = Math.min(
    100,
    Math.max(0, (votes / maxVotes) * 100),
  );

  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-surface-4"
      role="progressbar"
      aria-label={`${votes} votes`}
      aria-valuemin={0}
      aria-valuemax={maxVotes}
      aria-valuenow={Math.min(votes, maxVotes)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}

function SectionHeading({ eyebrow, title, count }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink sm:text-xl">
          {title}
        </h2>
      </div>
      {count !== undefined && (
        <span className="rounded-lg border border-line bg-surface-raised px-2.5 py-1 text-xs text-dim">
          {count} {count === 1 ? "result" : "results"}
        </span>
      )}
    </div>
  );
}

export default function Results() {
  const { roomId } = useParams();

  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setResults(null);
    setError(null);

    getResults(roomId)
      .then(({ data }) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.response?.data?.error ??
              err.message ??
              "Unable to load this room's results.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const topNotes = useMemo(
    () => (Array.isArray(results?.topNotes) ? results.topNotes : []),
    [results],
  );

  const topClusters = useMemo(
    () =>
      Array.isArray(results?.topClusters) ? results.topClusters : [],
    [results],
  );

  const totals = results?.totals ?? {};

  const maxNoteVotes = Math.max(
    1,
    ...topNotes.map((note) => Number(note.votes) || 0),
  );

  const maxClusterVotes = Math.max(
    1,
    ...topClusters.map((cluster) => Number(cluster.votes) || 0),
  );

  async function handleExport() {
    if (exporting) return;

    setExporting(true);
    setExportError("");

    try {
      await downloadExport(roomId);
    } catch (err) {
      setExportError(
        err.response?.data?.error ??
          err.message ??
          "The Markdown export could not be downloaded.",
      );
    } finally {
      setExporting(false);
    }
  }

  if (error) {
    return <ErrorResults error={error} roomId={roomId} />;
  }

  if (!results) {
    return <LoadingResults />;
  }

  return (
    <main className="min-h-dvh bg-canvas px-4 py-5 text-ink sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        {/* Top navigation */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
          <Link
            to="/"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl pr-2 text-sm font-semibold text-ink transition-colors hover:text-accent"
          >
            <span className="grid size-9 place-items-center rounded-xl border border-line bg-surface-raised text-accent">
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <ellipse cx="12" cy="12" rx="10" ry="4.5" />
                <ellipse
                  cx="12"
                  cy="12"
                  rx="10"
                  ry="4.5"
                  transform="rotate(60 12 12)"
                />
              </svg>
            </span>
            Constellate
          </Link>

          <span className="rounded-lg border border-line bg-surface-raised px-3 py-1.5 text-xs text-dim">
            Room {results.roomId || roomId}
          </span>
        </header>

        {/* Results introduction */}
        <section className="mb-8 sm:mb-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
            Session results
          </p>

          <h1 className="mt-3 max-w-3xl break-words text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl lg:text-4xl">
            {results.question || `Room ${results.roomId || roomId}`}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-dim sm:text-base">
            A snapshot of your team's ideas, clusters, and votes.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link
              to={`/room/${roomId}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface-raised px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-hover"
            >
              <ArrowLeftIcon />
              Back to board
            </Link>

            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-wait disabled:opacity-60"
            >
              <DownloadIcon />
              {exporting ? "Preparing export..." : "Export Markdown"}
            </button>
          </div>

          {exportError && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {exportError}
            </p>
          )}
        </section>

        {/* Session statistics */}
        <section
          aria-label="Session overview"
          className="mb-9 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
        >
          <StatCard
            label="Participants"
            value={totals.participants ?? 0}
            detail="People in the session"
          />
          <StatCard
            label="Ideas"
            value={totals.notes ?? 0}
            detail="Notes captured"
          />
          <StatCard
            label="Clusters"
            value={totals.clusters ?? 0}
            detail="Groups of ideas"
          />
          <StatCard
            label="Votes"
            value={totals.votes ?? 0}
            detail="Dots cast"
          />
        </section>

        {/* Top clusters */}
        <section className="mb-9">
          <SectionHeading
            eyebrow="Patterns & themes"
            title="Top clusters"
            count={topClusters.length}
          />

          {topClusters.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-8 text-center sm:py-10">
              <p className="text-sm font-medium text-ink">
                No clusters yet
              </p>
              <p className="mt-1 text-sm text-dim">
                Grouped ideas will appear here once your team creates clusters.
              </p>
            </div>
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2">
              {topClusters.map((cluster, i) => {
                const color = cluster.color || "#818cf8";

                return (
                  <li
                    key={cluster.id}
                    className="min-w-0 rounded-2xl border border-line bg-surface/80 p-4 transition-colors hover:border-line-strong sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-xl text-sm font-semibold"
                        style={{
                          color,
                          backgroundColor: `${color}18`,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {i + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <h3 className="break-words text-sm font-semibold leading-6 text-ink sm:text-base">
                          {cluster.name || "Untitled cluster"}
                        </h3>
                        <p className="mt-1 text-xs text-dim">
                          {cluster.noteCount ?? 0}{" "}
                          {(cluster.noteCount ?? 0) === 1 ? "idea" : "ideas"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold tabular-nums text-ink">
                          {cluster.votes ?? 0}
                        </p>
                        <p className="text-[10px] text-faint">
                          votes
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <VoteBar
                        votes={Number(cluster.votes) || 0}
                        maxVotes={maxClusterVotes}
                        color={color}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Top ideas */}
        <section className="mb-10">
          <SectionHeading
            eyebrow="Community favourites"
            title="Top ideas"
            count={topNotes.length}
          />

          {topNotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-4 py-10 text-center">
              <p className="text-sm font-medium text-ink">
                No ideas were captured
              </p>
              <p className="mt-1 text-sm text-dim">
                Add some notes to your board to see the results here.
              </p>
            </div>
          ) : (
            <ol className="flex flex-col gap-3">
              {topNotes.map((note, i) => (
                <li
                  key={note.id}
                  className="min-w-0 rounded-2xl border border-line bg-surface/80 p-4 transition-colors hover:border-line-strong sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 w-6 shrink-0 text-sm font-semibold tabular-nums text-faint">
                      {String(i + 1).padStart(2, "0")}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className="break-words text-sm font-medium leading-6 text-ink sm:text-base"
                            style={{
                              overflowWrap: "anywhere",
                            }}
                          >
                            {note.text || "Untitled idea"}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
                            <span>
                              {note.author || "Anonymous"}
                            </span>

                            {note.cluster && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="break-words text-dim">
                                  {note.cluster}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl border border-line bg-surface-raised px-3 py-2 text-right">
                          <p className="text-lg font-semibold leading-none tabular-nums text-ink">
                            {note.votes ?? 0}
                          </p>
                          <p className="mt-1 text-[10px] text-faint">
                            votes
                          </p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <VoteBar
                          votes={Number(note.votes) || 0}
                          maxVotes={maxNoteVotes}
                          color="#fbbf24"
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-line pt-5 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>Made for better ideas, together.</p>
          <Link
            to="/"
            className="inline-flex min-h-9 items-center gap-2 self-start text-dim transition-colors hover:text-accent sm:self-auto"
          >
            Start a new session
            <span aria-hidden="true">↗</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}