import {
  getRoom,
  publicState,
  publicNote,
  newId,
  clusterAt,
  makeQuestionNote,
  PHASES,
  PHASE_RULES,
  CLUSTER_COLORS,
  voteCounts,
} from "../lib/rooms.js";
import { scheduleSave } from "../lib/persistence.js";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const ID = /^[a-z]_[0-9a-f]{10}$/;
const isCoord = (n) =>
  typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1e6;
const isSize = (n) =>
  typeof n === "number" && Number.isFinite(n) && n >= 60 && n <= 5000;
const clean = (s, max) => String(s ?? "").slice(0, max);

const FONT_FAMILIES = ["sans", "serif", "mono", "hand"];
const FONT_SIZES = [12, 14, 18, 24];

const contexts = new Map();

// Sends the full authoritative state to every member, serialized per recipient
export function broadcastState(io, room) {
  for (const [socketId, ctx] of contexts) {
    if (ctx.roomId !== room.roomId) continue;
    io.sockets.sockets
      .get(socketId)
      ?.emit("room:state", publicState(room, ctx.userId));
  }
}

const timerTimeouts = new Map();

function broadcastTimer(io, room) {
  io.to(room.roomId).emit("timer:updated", { timer: room.settings.timer });
}

function armTimer(io, room) {
  clearTimeout(timerTimeouts.get(room.roomId));
  const timer = room.settings.timer;
  if (!timer.running || !timer.endsAt) return;
  const ms = timer.endsAt - Date.now();
  timerTimeouts.set(
    room.roomId,
    setTimeout(
      () => {
        timer.running = false;
        timer.remaining = 0;
        timer.endsAt = null;
        broadcastTimer(io, room);
        scheduleSave(room);
      },
      Math.max(0, ms),
    ),
  );
}

export function registerRoomHandlers(io, socket) {
  const ctx = { roomId: null, userId: null, isHost: false };
  contexts.set(socket.id, ctx);

  const guarded = (fn) => (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const room = ctx.roomId ? getRoom(ctx.roomId) : null;
    if (!room)
      return reply({ ok: false, code: "NOT_IN_ROOM", error: "Not in a room" });
    return fn(room, payload ?? {}, reply);
  };

  const deny = (reply, code, error) => reply({ ok: false, code, error });

  // join socket
  socket.on("join", (payload = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (ctx.roomId)
      return deny(reply, "ALREADY_JOINED", "Already joined a room");

    const room = getRoom(payload.roomId);
    if (!room)
      return deny(
        reply,
        "ROOM_NOT_FOUND",
        "Room not found. Check the link, or ask the host for a new one.",
      );

    const userId = clean(payload.userId, 64);
    if (!userId) return deny(reply, "BAD_INPUT", "userId required");

    ctx.roomId = room.roomId;
    ctx.userId = userId;
    ctx.isHost = payload.hostToken === room.hostToken; // the host token proves who created the room

    const participant = {
      name: clean(payload.name, 30).trim() || "Guest",
      color: COLOR.test(payload.color) ? payload.color : "#7aa2ff",
    };
    room.users[userId] = { name: participant.name, color: participant.color };

    const existing = room.participants[userId];
    room.participants[userId] = {
      ...participant,
      connections: (existing?.connections ?? 0) + 1,
    };

    socket.join(room.roomId);
    if (!existing)
      socket.to(room.roomId).emit("presence:join", { userId, ...participant });

    scheduleSave(room);
    reply({
      ok: true,
      you: { userId, isHost: ctx.isHost },
      state: publicState(room, userId),
    });
  });

  // notes socket
  socket.on(
    "note:create",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!rules.noteCreate)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Brainstorming is closed during the ${room.phase} phase`,
        );
      if (!isCoord(p.x) || !isCoord(p.y))
        return deny(reply, "BAD_INPUT", "Bad position");
      if (
        p.id !== undefined &&
        (typeof p.id !== "string" || !ID.test(p.id) || room.notes[p.id])
      ) {
        return deny(reply, "BAD_INPUT", "Bad or duplicate note id");
      }

      const note = {
        id: p.id ?? newId("n_"),
        type: "note",
        x: p.x,
        y: p.y,
        text: clean(p.text, 500),
        color: COLOR.test(p.color) ? p.color : "#ffd166",
        fontSize: FONT_SIZES.includes(p.fontSize) ? p.fontSize : 14,
        fontFamily: FONT_FAMILIES.includes(p.fontFamily)
          ? p.fontFamily
          : "sans",
        authorId: ctx.userId,
        clusterId: clusterAt(room, p.x + 90, p.y + 40)?.id ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      room.notes[note.id] = note;

      socket.to(room.roomId).emit("note:created", publicNote(room, note));
      scheduleSave(room);
      reply({ ok: true, note });
    }),
  );

  socket.on(
    "note:update",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      const note = room.notes[p.id];
      if (!note) return deny(reply, "NOT_FOUND", "Note not found");
      if (!rules.noteEdit)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Notes are locked during the ${room.phase} phase`,
        );
      if (note.type === "question" && !ctx.isHost)
        return deny(
          reply,
          "FORBIDDEN",
          "Only the host can edit the session question",
        );
      if (note.type !== "question" && note.authorId !== ctx.userId) {
        return deny(reply, "FORBIDDEN", "Only the author can edit this note");
      }

      const changes = {};
      if (p.text !== undefined) changes.text = clean(p.text, 500);
      if (p.color !== undefined) {
        if (note.type === "question")
          return deny(reply, "FORBIDDEN", "The question note keeps its style");
        if (!COLOR.test(p.color)) return deny(reply, "BAD_INPUT", "Bad color");
        changes.color = p.color;
      }
      if (p.fontSize !== undefined) {
        if (!FONT_SIZES.includes(p.fontSize))
          return deny(reply, "BAD_INPUT", "Bad font size");
        changes.fontSize = p.fontSize;
      }
      if (p.fontFamily !== undefined) {
        if (!FONT_FAMILIES.includes(p.fontFamily))
          return deny(reply, "BAD_INPUT", "Bad font");
        changes.fontFamily = p.fontFamily;
      }
      changes.updatedAt = Date.now();
      Object.assign(note, changes);

      if (note.type === "question" && changes.text !== undefined) {
        room.question = changes.text;
        io.to(room.roomId).emit("question:updated", {
          question: room.question,
        });
      }

      socket.to(room.roomId).emit("note:updated", { id: note.id, ...changes });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  socket.on(
    "note:move",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      const note = room.notes[p.id];
      if (!note) return deny(reply, "NOT_FOUND", "Note not found");
      if (!isCoord(p.x) || !isCoord(p.y))
        return deny(reply, "BAD_INPUT", "Bad position");

      if (rules.noteMove === "none")
        return deny(
          reply,
          "PHASE_LOCKED",
          `Notes are locked during the ${room.phase} phase`,
        );
      if (note.type === "question" && !ctx.isHost)
        return deny(
          reply,
          "FORBIDDEN",
          "Only the host can move the session question",
        );
      if (
        note.type !== "question" &&
        rules.noteMove === "author" &&
        note.authorId !== ctx.userId &&
        !ctx.isHost
      ) {
        return deny(
          reply,
          "FORBIDDEN",
          "You can only move your own notes during Diverge",
        );
      }

      note.x = p.x;
      note.y = p.y;
      note.clusterId =
        note.type === "question"
          ? null
          : (clusterAt(room, p.x + 90, p.y + 40)?.id ?? null);

      socket.to(room.roomId).emit("note:moved", {
        id: note.id,
        x: note.x,
        y: note.y,
        clusterId: note.clusterId,
      });
      scheduleSave(room);
      reply({ ok: true, clusterId: note.clusterId });
    }),
  );

  socket.on(
    "note:delete",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!rules.noteDelete) {
        return deny(
          reply,
          "PHASE_LOCKED",
          "Notes can only be deleted during the Diverge phase",
        );
      }

      const note = room.notes[p.id];
      if (!note) return deny(reply, "NOT_FOUND", "Note not found");
      if (note.type === "question")
        return deny(
          reply,
          "FORBIDDEN",
          "The session question can't be deleted",
        );
      if (note.authorId !== ctx.userId && !ctx.isHost) {
        return deny(
          reply,
          "FORBIDDEN",
          "Only the author or the host can delete this note",
        );
      }

      delete room.notes[p.id];
      // Arrows and votes attached to a deleted note go with it (clients do the same on their side)
      for (const edge of Object.values(room.edges)) {
        if (edge.source === p.id || edge.target === p.id)
          delete room.edges[edge.id];
      }
      room.votes = room.votes.filter(
        (v) => !(v.targetType === "note" && v.targetId === p.id),
      );

      socket.to(room.roomId).emit("note:deleted", { id: p.id });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  // edges socket
  socket.on(
    "edge:create",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!rules.edges)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Connectors are locked during the ${room.phase} phase`,
        );

      const { source, target } = p;
      if (!room.notes[source] || !room.notes[target])
        return deny(reply, "NOT_FOUND", "Note not found");
      if (source === target)
        return deny(reply, "BAD_INPUT", "A note can't point to itself");
      const exists = Object.values(room.edges).some(
        (e) => e.source === source && e.target === target,
      );
      if (exists) return deny(reply, "DUPLICATE", "Already connected");
      if (
        p.id !== undefined &&
        (typeof p.id !== "string" || !ID.test(p.id) || room.edges[p.id])
      ) {
        return deny(reply, "BAD_INPUT", "Bad or duplicate edge id");
      }

      const bend =
        typeof p.bend === "number" &&
        Number.isFinite(p.bend) &&
        Math.abs(p.bend) <= 2000
          ? Math.round(p.bend)
          : undefined;
      const edge = {
        id: p.id ?? newId("e_"),
        source,
        target,
        authorId: ctx.userId,
        ...(bend !== undefined ? { bend } : {}),
      };
      room.edges[edge.id] = edge;

      socket.to(room.roomId).emit("edge:created", edge);
      scheduleSave(room);
      reply({ ok: true, edge });
    }),
  );

  socket.on(
    "edge:delete",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!rules.edges)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Connectors are locked during the ${room.phase} phase`,
        );

      const edge = room.edges[p.id];
      if (!edge) return deny(reply, "NOT_FOUND", "Arrow not found");
      if (edge.authorId !== ctx.userId && !ctx.isHost) {
        return deny(
          reply,
          "FORBIDDEN",
          "Only the author or the host can delete this arrow",
        );
      }

      delete room.edges[p.id];

      socket.to(room.roomId).emit("edge:deleted", { id: p.id });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  socket.on(
    "edge:update",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!rules.edges)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Connectors are locked during the ${room.phase} phase`,
        );

      const edge = room.edges[p.id];
      if (!edge) return deny(reply, "NOT_FOUND", "Arrow not found");
      if (edge.authorId !== ctx.userId && !ctx.isHost)
        return deny(
          reply,
          "FORBIDDEN",
          "Only the author or the host can reshape this arrow",
        );
      if (
        p.bend !== undefined &&
        (typeof p.bend !== "number" ||
          !Number.isFinite(p.bend) ||
          Math.abs(p.bend) > 2000)
      ) {
        return deny(reply, "BAD_INPUT", "Bad bend");
      }

      if (p.bend === undefined) delete edge.bend;
      else edge.bend = Math.round(p.bend);

      socket
        .to(room.roomId)
        .emit("edge:updated", { id: edge.id, bend: edge.bend });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  // clusters socket
  socket.on(
    "cluster:create",
    guarded((room, p, reply) => {
      if (!PHASE_RULES[room.phase].clusters)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Clustering is only available during the Cluster phase`,
        );
      if (!isCoord(p.x) || !isCoord(p.y))
        return deny(reply, "BAD_INPUT", "Bad position");

      const cluster = {
        id: newId("c_"),
        name: clean(p.name, 60).trim() || "New cluster",
        x: p.x,
        y: p.y,
        width: isSize(p.width) ? p.width : 420,
        height: isSize(p.height) ? p.height : 300,
        color: COLOR.test(p.color)
          ? p.color
          : CLUSTER_COLORS[
              Object.keys(room.clusters).length % CLUSTER_COLORS.length
            ],
        authorId: ctx.userId,
        createdAt: Date.now(),
      };
      room.clusters[cluster.id] = cluster;

      // Adopt notes that are already inside the new cluster's bounds
      for (const note of Object.values(room.notes)) {
        if (note.type === "question") continue;

        const cx = note.x + 90;
        const cy = note.y + 40;
        if (
          cx >= cluster.x &&
          cx <= cluster.x + cluster.width &&
          cy >= cluster.y &&
          cy <= cluster.y + cluster.height
        ) {
          note.clusterId = cluster.id;
        }
      }

      socket.to(room.roomId).emit("cluster:created", cluster);
      broadcastState(io, room); // memberships changed
      scheduleSave(room);
      reply({ ok: true, cluster });
    }),
  );

  socket.on(
    "cluster:update",
    guarded((room, p, reply) => {
      if (!PHASE_RULES[room.phase].clusters)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Clustering is only available during the Cluster phase`,
        );
      const cluster = room.clusters[p.id];
      if (!cluster) return deny(reply, "NOT_FOUND", "Cluster not found");

      const changes = {};
      if (p.name !== undefined)
        changes.name = clean(p.name, 60).trim() || cluster.name;
      if (p.color !== undefined) {
        if (!COLOR.test(p.color)) return deny(reply, "BAD_INPUT", "Bad color");
        changes.color = p.color;
      }
      if (p.width !== undefined) {
        if (!isSize(p.width)) return deny(reply, "BAD_INPUT", "Bad width");
        changes.width = p.width;
      }
      if (p.height !== undefined) {
        if (!isSize(p.height)) return deny(reply, "BAD_INPUT", "Bad height");
        changes.height = p.height;
      }
      Object.assign(cluster, changes);

      socket
        .to(room.roomId)
        .emit("cluster:updated", { id: cluster.id, ...changes });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  socket.on(
    "cluster:move",
    guarded((room, p, reply) => {
      const rules = PHASE_RULES[room.phase];
      if (!PHASE_RULES[room.phase].clusters) {
        return deny(
          reply,
          "PHASE_LOCKED",
          `Clusters are locked during the ${room.phase} phase`,
        );
      }
      const cluster = room.clusters[p.id];
      if (!cluster) return deny(reply, "NOT_FOUND", "Cluster not found");
      if (!isCoord(p.x) || !isCoord(p.y))
        return deny(reply, "BAD_INPUT", "Bad position");

      const dx = p.x - cluster.x;
      const dy = p.y - cluster.y;
      cluster.x = p.x;
      cluster.y = p.y;

      // Member notes travel with their cluster so the group stays together
      const moved = [];
      if (dx !== 0 || dy !== 0) {
        for (const note of Object.values(room.notes)) {
          if (note.clusterId !== cluster.id) continue;
          note.x += dx;
          note.y += dy;
          moved.push({
            id: note.id,
            x: note.x,
            y: note.y,
            clusterId: note.clusterId,
          });
        }
      }

      socket.to(room.roomId).emit("cluster:moved", {
        id: cluster.id,
        x: cluster.x,
        y: cluster.y,
        notes: moved,
      });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  socket.on(
    "cluster:delete",
    guarded((room, p, reply) => {
      if (!PHASE_RULES[room.phase].clusters)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Clustering is only available during the Cluster phase`,
        );
      const cluster = room.clusters[p.id];
      if (!cluster) return deny(reply, "NOT_FOUND", "Cluster not found");

      delete room.clusters[p.id];
      const freed = [];
      for (const note of Object.values(room.notes)) {
        if (note.clusterId === p.id) {
          note.clusterId = null;
          freed.push(note.id);
        }
      }
      room.votes = room.votes.filter(
        (v) => !(v.targetType === "cluster" && v.targetId === p.id),
      );

      socket
        .to(room.roomId)
        .emit("cluster:deleted", { id: p.id, noteIds: freed });
      scheduleSave(room);
      reply({ ok: true });
    }),
  );

  // votes socket
  socket.on(
    "vote:add",
    guarded((room, p, reply) => {
      if (!PHASE_RULES[room.phase].vote)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Voting is only open during the Converge phase`,
        );

      const targetType = p.targetType === "cluster" ? "cluster" : "note";
      const target =
        targetType === "cluster"
          ? room.clusters[p.targetId]
          : room.notes[p.targetId];
      if (!target) return deny(reply, "NOT_FOUND", "Vote target not found");
      if (targetType === "note" && target.type === "question")
        return deny(
          reply,
          "BAD_INPUT",
          "The session question can't be voted on",
        );

      const mine = room.votes.filter((v) => v.userId === ctx.userId);
      if (mine.length >= room.settings.voteBudget) {
        return deny(
          reply,
          "VOTE_BUDGET_EXCEEDED",
          "You have used all your vote dots",
        );
      }

      const vote = {
        id: newId("v_"),
        userId: ctx.userId,
        targetId: p.targetId,
        targetType,
      };
      room.votes.push(vote);

      socket.to(room.roomId).emit("vote:added", voteCounts(room));
      scheduleSave(room);
      reply({ ok: true, vote });
    }),
  );

  socket.on(
    "vote:remove",
    guarded((room, p, reply) => {
      if (!PHASE_RULES[room.phase].vote)
        return deny(
          reply,
          "PHASE_LOCKED",
          `Voting is only open during the Converge phase`,
        );

      // Remove this user's most recent dot on the target, so they recover it
      for (let i = room.votes.length - 1; i >= 0; i--) {
        const vote = room.votes[i];
        if (vote.userId === ctx.userId && vote.targetId === p.targetId) {
          room.votes.splice(i, 1);
          socket.to(room.roomId).emit("vote:removed", voteCounts(room));
          scheduleSave(room);
          return reply({ ok: true, vote });
        }
      }
      return deny(reply, "NOT_FOUND", "You have no dot on that target");
    }),
  );

  // phases & settings socket
  socket.on(
    "phase:change",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(reply, "FORBIDDEN", "Only the host can change the phase");
      if (!PHASES.includes(p.phase))
        return deny(reply, "BAD_INPUT", "Unknown phase");

      const step = PHASES.indexOf(p.phase) - PHASES.indexOf(room.phase);
      if (Math.abs(step) !== 1) {
        return deny(
          reply,
          "BAD_TRANSITION",
          "Phases can only move one step forward or back",
        );
      }

      room.phase = p.phase;
      broadcastState(io, room);
      scheduleSave(room);
      reply({ ok: true, phase: room.phase });
    }),
  );

  socket.on(
    "room:question",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(
          reply,
          "FORBIDDEN",
          "Only the host can set the session question",
        );
      const question = clean(p.question, 200).trim();
      if (!question) return deny(reply, "BAD_INPUT", "Question required");

      room.question = question;
      io.to(room.roomId).emit("question:updated", { question });

      // Upsert the anchor note in the center of the canvas
      const anchor = Object.values(room.notes).find(
        (n) => n.type === "question",
      );
      if (anchor) {
        anchor.text = question;
        anchor.updatedAt = Date.now();
        broadcastState(io, room);
      } else {
        const note = makeQuestionNote(question);
        room.notes[note.id] = note;
        broadcastState(io, room);
      }

      scheduleSave(room);
      reply({ ok: true, question });
    }),
  );

  socket.on(
    "settings:voteBudget",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(
          reply,
          "FORBIDDEN",
          "Only the host can change the vote budget",
        );
      const budget = Number(p.voteBudget);
      if (!Number.isInteger(budget) || budget < 1 || budget > 25)
        return deny(reply, "BAD_INPUT", "Budget must be 1-25");

      room.settings.voteBudget = budget;
      io.to(room.roomId).emit("settings:updated", { voteBudget: budget });
      scheduleSave(room);
      reply({ ok: true, voteBudget: budget });
    }),
  );

  // timer socket
  socket.on(
    "timer:start",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(reply, "FORBIDDEN", "Only the host controls the timer");
      const timer = room.settings.timer;
      if (p.duration !== undefined) {
        const duration = Number(p.duration);
        if (!Number.isFinite(duration) || duration < 30 || duration > 7200)
          return deny(reply, "BAD_INPUT", "Duration must be 30–7200 seconds");
        timer.duration = Math.round(duration);
        timer.remaining = timer.duration;
      }
      if (timer.remaining <= 0) timer.remaining = timer.duration;
      timer.running = true;
      timer.endsAt = Date.now() + timer.remaining * 1000;

      armTimer(io, room);
      broadcastTimer(io, room);
      scheduleSave(room);
      reply({ ok: true, timer });
    }),
  );

  socket.on(
    "timer:pause",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(reply, "FORBIDDEN", "Only the host controls the timer");
      const timer = room.settings.timer;
      if (timer.running && timer.endsAt)
        timer.remaining = Math.max(
          0,
          Math.ceil((timer.endsAt - Date.now()) / 1000),
        );
      timer.running = false;
      timer.endsAt = null;
      clearTimeout(timerTimeouts.get(room.roomId));

      broadcastTimer(io, room);
      scheduleSave(room);
      reply({ ok: true, timer });
    }),
  );

  socket.on(
    "timer:reset",
    guarded((room, p, reply) => {
      if (!ctx.isHost)
        return deny(reply, "FORBIDDEN", "Only the host controls the timer");
      const timer = room.settings.timer;
      timer.running = false;
      timer.endsAt = null;
      timer.remaining = timer.duration;
      clearTimeout(timerTimeouts.get(room.roomId));

      broadcastTimer(io, room);
      scheduleSave(room);
      reply({ ok: true, timer });
    }),
  );

  // cursors socket
  socket.on(
    "cursor:move",
    guarded((room, p) => {
      if (!isCoord(p.x) || !isCoord(p.y)) return;
      socket.volatile
        .to(room.roomId)
        .emit("cursor:move", { userId: ctx.userId, x: p.x, y: p.y });
    }),
  );

  // leaving socket
  socket.on("disconnect", () => {
    contexts.delete(socket.id);
    if (!ctx.roomId) return;

    const room = getRoom(ctx.roomId);
    if (!room) return;

    const participant = room.participants[ctx.userId];
    if (participant) {
      participant.connections -= 1;
      if (participant.connections <= 0) {
        delete room.participants[ctx.userId];
        io.to(room.roomId).emit("presence:leave", { userId: ctx.userId });
      }
      scheduleSave(room);
    }
  });
}
