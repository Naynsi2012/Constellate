import { getRoom, publicState, newId } from "../lib/rooms.js";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const isCoord = (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1e6;
const clean = (s, max) => String(s ?? "").slice(0, max);

const FONT_FAMILIES = ["sans", "serif", "mono", "hand"];
const FONT_SIZES = [12, 14, 18, 24];

export function registerRoomHandlers(io, socket) {
  const ctx = { roomId: null, userId: null, isHost: false };

  const guarded = (fn) => (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const room = ctx.roomId ? getRoom(ctx.roomId) : null;
    if (!room) return reply({ ok: false, error: "not in a room" });
    return fn(room, payload ?? {}, reply);
  };

  // join socket
  socket.on("join", (payload = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (ctx.roomId) return reply({ ok: false, error: "already joined" });

    const room = getRoom(payload.roomId);
    if (!room) return reply({ ok: false, error: "Room not found. Check the link, or ask the host for a new one." });

    const userId = clean(payload.userId, 64);
    if (!userId) return reply({ ok: false, error: "userId required" });

    ctx.roomId = room.roomId;
    ctx.userId = userId;
    ctx.isHost = payload.hostToken === room.hostToken; // The host token proves who created the room

    const participant = {
      name: clean(payload.name, 30).trim() || "Guest",
      color: COLOR.test(payload.color) ? payload.color : "#7aa2ff",
    };
    room.participants[userId] = participant;

    socket.join(room.roomId);
    socket.to(room.roomId).emit("presence:join", { userId, ...participant });

    reply({ ok: true, you: { userId, isHost: ctx.isHost }, state: publicState(room) });
  });

  // notes socket
  socket.on(
    "note:create",
    guarded((room, p, reply) => {
      if (!isCoord(p.x) || !isCoord(p.y)) return reply({ ok: false, error: "bad position" });

      const note = {
        id: newId("n_"),
        x: p.x,
        y: p.y,
        text: clean(p.text, 500),
        color: COLOR.test(p.color) ? p.color : "#ffd166",
        fontSize: 14,
        fontFamily: "sans",
        authorId: ctx.userId,
        clusterId: null,
        createdAt: Date.now(),
      };
      room.notes[note.id] = note;

      socket.to(room.roomId).emit("note:created", note);
      reply({ ok: true, note });
    }),
  );

  socket.on(
    "note:update",
    guarded((room, p, reply) => {
      const note = room.notes[p.id];
      if (!note) return reply({ ok: false, error: "note not found" });
      if (note.authorId !== ctx.userId) {
        return reply({ ok: false, error: "Only the author can edit this note" });
      }

      const changes = {};
      if (p.text !== undefined) changes.text = clean(p.text, 500);
      if (p.color !== undefined) {
        if (!COLOR.test(p.color)) return reply({ ok: false, error: "bad color" });
        changes.color = p.color;
      }
      if (p.fontSize !== undefined) {
        if (!FONT_SIZES.includes(p.fontSize)) return reply({ ok: false, error: "bad font size" });
        changes.fontSize = p.fontSize;
      }
      if (p.fontFamily !== undefined) {
        if (!FONT_FAMILIES.includes(p.fontFamily)) return reply({ ok: false, error: "bad font" });
        changes.fontFamily = p.fontFamily;
      }
      Object.assign(note, changes);

      socket.to(room.roomId).emit("note:updated", { id: note.id, ...changes });
      reply({ ok: true });
    }),
  );

  socket.on(
    "note:move",
    guarded((room, p, reply) => {
      const note = room.notes[p.id];
      if (!note) return reply({ ok: false, error: "note not found" });
      if (!isCoord(p.x) || !isCoord(p.y)) return reply({ ok: false, error: "bad position" });

      note.x = p.x;
      note.y = p.y;

      socket.to(room.roomId).emit("note:moved", { id: note.id, x: note.x, y: note.y });
      reply({ ok: true });
    }),
  );

  socket.on(
    "note:delete",
    guarded((room, p, reply) => {
      const note = room.notes[p.id];
      if (!note) return reply({ ok: false, error: "note not found" });
      if (note.authorId !== ctx.userId && !ctx.isHost) {
        return reply({ ok: false, error: "Only the author or the host can delete this note" });
      }

      delete room.notes[p.id];
      // arrows attached to a deleted note go with it (clients do the same on their side)
      for (const edge of Object.values(room.edges)) {
        if (edge.source === p.id || edge.target === p.id) delete room.edges[edge.id];
      }

      socket.to(room.roomId).emit("note:deleted", { id: p.id });
      reply({ ok: true });
    }),
  );

  // arrows between notes socket
  socket.on(
    "edge:create",
    guarded((room, p, reply) => {
      const { source, target } = p;
      if (!room.notes[source] || !room.notes[target]) return reply({ ok: false, error: "note not found" });
      if (source === target) return reply({ ok: false, error: "A note can't point to itself" });
      const exists = Object.values(room.edges).some((e) => e.source === source && e.target === target);
      if (exists) return reply({ ok: false, error: "Already connected" });

      const edge = { id: newId("e_"), source, target, authorId: ctx.userId };
      room.edges[edge.id] = edge;

      socket.to(room.roomId).emit("edge:created", edge);
      reply({ ok: true, edge });
    }),
  );

  socket.on(
    "edge:delete",
    guarded((room, p, reply) => {
      const edge = room.edges[p.id];
      if (!edge) return reply({ ok: false, error: "arrow not found" });
      if (edge.authorId !== ctx.userId && !ctx.isHost) {
        return reply({ ok: false, error: "Only the author or the host can delete this arrow" });
      }

      delete room.edges[p.id];

      socket.to(room.roomId).emit("edge:deleted", { id: p.id });
      reply({ ok: true });
    }),
  );

  // cursors socket
  socket.on(
    "cursor:move",
    guarded((room, p) => {
      if (!isCoord(p.x) || !isCoord(p.y)) return;
      // volatile = fine to drop if the network is busy; the next one replaces it
      socket.volatile.to(room.roomId).emit("cursor:move", { userId: ctx.userId, x: p.x, y: p.y });
    }),
  );

  // leaving socket
  socket.on("disconnect", () => {
    if (ctx.roomId) io.to(ctx.roomId).emit("presence:leave", { userId: ctx.userId });
  });
}