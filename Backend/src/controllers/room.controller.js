import { createNewRoom, getRoom, voteCounts } from "../lib/rooms.js";

export async function createRoom(req, res) {
  const question =
    typeof req.body?.question === "string" ? req.body.question : "";
  const room = createNewRoom({ question });
  res.status(201).json({
    message: "Room created successfully",
    roomId: room.roomId,
    hostToken: room.hostToken,
  });
}

function buildResults(room) {
  const { perNote, perCluster } = voteCounts(room);

  const topNotes = Object.values(room.notes)
    .filter((note) => note.type !== "question")
    .map((note) => ({
      id: note.id,
      text: note.text,
      color: note.color,
      author: note.authorId
        ? (room.users[note.authorId]?.name ?? "Unknown")
        : null,
      clusterId: note.clusterId,
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
      noteCount: Object.values(room.notes).filter(
        (n) => n.clusterId === cluster.id,
      ).length,
      createdAt: cluster.createdAt,
    }))
    .sort(
      (a, b) =>
        b.votes - a.votes ||
        b.noteCount - a.noteCount ||
        a.createdAt - b.createdAt,
    );

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
  if (room.phase !== "converge") {
    return res
      .status(403)
      .json({ error: "Results are available after the Converge phase begins" });
  }
  res.json(buildResults(room));
}

function mdEscape(text) {
  return String(text ?? "")
    .replace(/\r?\n/g, " ")
    .trim();
}

export function exportMarkdown(req, res) {
  const room = getRoom(req.params.roomId);
  if (!room) return res.status(404).json({ error: "Room not found" });
  if (room.phase !== "converge") {
    return res
      .status(403)
      .json({ error: "Export is available after the Converge phase begins" });
  }
  const token = req.headers["x-host-token"];
  if (!token || token !== room.hostToken) {
    return res.status(403).json({ error: "Only the host can export" });
  }

  const results = buildResults(room);
  const byCluster = new Map();
  const ungrouped = [];
  for (const note of results.topNotes) {
    const cluster = results.topClusters.find((c) => c.id === note.clusterId);
    if (cluster) {
      if (!byCluster.has(cluster.id)) byCluster.set(cluster.id, []);
      byCluster.get(cluster.id).push(note);
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
    lines.push(
      `## ${mdEscape(cluster.name)} (${cluster.votes} vote${cluster.votes === 1 ? "" : "s"})`,
    );
    lines.push("");
    const members = byCluster.get(cluster.id) ?? [];
    if (members.length === 0) {
      lines.push("- (no ideas in this cluster)");
    } else {
      for (const note of members) {
        const author = note.author ? ` — ${mdEscape(note.author)}` : "";
        lines.push(
          `- ${mdEscape(note.text)} (${note.votes} vote${note.votes === 1 ? "" : "s"})${author}`,
        );
      }
    }
    lines.push("");
  }

  if (ungrouped.length > 0) {
    lines.push("## Ungrouped ideas");
    lines.push("");
    for (const note of ungrouped) {
      const author = note.author ? ` — ${mdEscape(note.author)}` : "";
      lines.push(
        `- ${mdEscape(note.text)} (${note.votes} vote${note.votes === 1 ? "" : "s"})${author}`,
      );
    }
    lines.push("");
  }

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="constellate-${room.roomId}-results.md"`,
  );
  res.send(lines.join("\n"));
}
