import { createNewRoom, getRoom, voteCounts } from "../lib/rooms.js";

export async function createRoom(req, res) {
  const question = typeof req.body?.question === "string" ? req.body.question : "";
  const room = createNewRoom({ question });

  res
    .status(201)
    .json({
      message: "Room created successfully",
      roomId: room.roomId,
      hostToken: room.hostToken,
    });
}

// Ranked session summary: top clusters and top notes by votes
function buildResults(room) {
  const { perNote, perCluster } = voteCounts(room);

  const authorName = (note) =>
    note.type === "question" ? null : (room.users[note.authorId]?.name ?? "Unknown");

  const clusterName = (note) =>
    note.clusterId ? (room.clusters[note.clusterId]?.name ?? null) : null;

  const topNotes = Object.values(room.notes)
    .filter((note) => note.type !== "question")
    .map((note) => ({
      id: note.id,
      text: note.text,
      color: note.color,
      author: authorName(note),
      cluster: clusterName(note),
      votes: perNote[note.id] ?? 0,
      createdAt: note.createdAt,
    }))
    .sort((a, b) => b.votes - a.votes || a.createdAt - b.createdAt);

  const topClusters = Object.values(room.clusters)
    .map((cluster) => ({
      id: cluster.id,
      name: cluster.name,
      color: cluster.color,
      votes: perCluster[cluster.id] ?? 0,
      noteCount: Object.values(room.notes).filter((n) => n.clusterId === cluster.id).length,
      createdAt: cluster.createdAt,
    }))
    .sort((a, b) => b.votes - a.votes || b.noteCount - a.noteCount || a.createdAt - b.createdAt);

  return {
    roomId: room.roomId,
    question: room.question,
    phase: room.phase,
    topClusters,
    topNotes,
    totals: {
      notes: topNotes.length,
      clusters: topClusters.length,
      votes: room.votes.length,
      participants: Object.keys(room.users).length,
    },
  };
}

export function getResults(req, res) {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(buildResults(room));
}

function mdEscape(text) {
  return String(text ?? "").replace(/\r?\n/g, " ").trim();
}

// Clusters as headings, notes as bullets sorted by votes, then ungrouped ideas
export function exportMarkdown(req, res) {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });

  const results = buildResults(room);
  const byCluster = new Map();
  const ungrouped = [];
  for (const note of results.topNotes) {
    if (note.cluster && results.topClusters.some((c) => c.name === note.cluster)) {
      if (!byCluster.has(note.cluster)) byCluster.set(note.cluster, []);
      byCluster.get(note.cluster).push(note);
    } else {
      ungrouped.push(note);
    }
  }

  const lines = [];
  lines.push("# Brainstorm Results");
  lines.push("");
  if (room.question) {
    lines.push(`> ${mdEscape(room.question)}`);
    lines.push("");
  }
  lines.push(
    `_Room ${room.roomId} · ${results.totals.participants} participant(s) · ${results.totals.notes} ideas · ${results.totals.votes} votes · Exported ${new Date().toISOString()}_`,
  );
  lines.push("");

  for (const cluster of results.topClusters) {
    lines.push(`## ${mdEscape(cluster.name)} — ${cluster.votes} vote(s)`);
    lines.push("");
    const members = byCluster.get(cluster.name) ?? [];
    if (members.length === 0) {
      lines.push("- _(no ideas in this cluster)_");
    } else {
      for (const note of members) {
        const author = note.author ? ` — ${mdEscape(note.author)}` : "";
        lines.push(`- ${mdEscape(note.text)} — ${note.votes} vote(s)${author}`);
      }
    }
    lines.push("");
  }

  if (ungrouped.length > 0) {
    lines.push("## Ungrouped ideas");
    lines.push("");
    for (const note of ungrouped) {
      const author = note.author ? ` — ${mdEscape(note.author)}` : "";
      lines.push(`- ${mdEscape(note.text)} — ${note.votes} vote(s)${author}`);
    }
    lines.push("");
  }

  const markdown = lines.join("\n");
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="constellate-${room.roomId}-results.md"`);
  res.send(markdown);
}
