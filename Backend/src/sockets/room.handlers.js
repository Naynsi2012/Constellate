import { getRoom, publicState, newId } from "../lib/rooms.js";

const COLOR = /^#[0-9a-fA-F]{6}$/;
const isCoord = (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= 1e6;
const clean = (s, max) => String(s ?? "").slice(0, max);

export function registerRoomHandlers(io, socket) {
  const ctx = { roomId: null, userId: null, isHost: false };

  const guarded = (fn) => (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    const room = ctx.roomId ? getRoom(ctx.roomId) : null;
    if (!room) return reply({ ok: false, error: "not in a room" });
  }

  // JOIN SOCKET
  socket.on("join", (payload = {}, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    if (ctx.roomId) return reply({ ok: false, error: "already joined" });

    const room = getRoom(payload.roomId);
    if (!room) return reply({ ok: false, error: "Room not found. Check the link, or ask the host for a new one." })
    
    const userId = clean(payload.userId, 64);
    if (!userId) return reply({ ok: false, error: "userId required" });

    ctx.roomId = room.roomId;
    ctx.userId = userId;
    ctx.isHost = payload.hostToken === room.hostToken; // The host token proves who created the room.

    const participant = {
      name: clean(payload.name, 30).trim() || "Guest",
      color: COLOR.test(payload.color) ? payload.color : "#7aa2ff" 
    }
    room.participants[userId] = participant;

    socket.join(room.roomId);
    socket.to(room.roomId).emit("presence:join", { userId, ...participant });

    reply({ ok: true, you: { userId, isHost: ctx.isHost }, state: publicState(room) })
  })

  // NOTE SOCKET
  socket.on("note:create", guarded((room, p, reply) => {
    if (!isCoord(p.x) || !isCoord(p.y)) return reply({ ok: false, error: "bad position" });

    const note = {
      id: newId("n_"),
      x: p.x,
      y: p.y,
      text: clean(p.text, 500),
      color: COLOR.test(p.color) ? p.color : "#ffd166",
      authorId: ctx.userId,
      clusterId: null,
      createdAt: Date.now()
    }
    room.notes[note.id] = note;

    socket.to(room.roomId).emit("note:created", note);
    reply({ ok: true, note });
  }))

  socket.on("note:update", guarded((room, p, reply) => {
    const note = room.notes[p.id];
    if (!note) return reply({ ok: false, error: "note not found" });

    const changes = {};
    if (p.text !== undefined) changes.text = clean(p.text, 500);
    if (p.color !== undefined){
      if (!COLOR.test(p.color)) return reply({ok: false, error: "bad color"});
      changes.color = p.color;
    }
    Object.assign(note, changes);

    socket.to(room.roomId).emit("note:updated", { id: note.id, ...changes });
    reply({ ok: true });
  }))

  socket.on("note:move", guarded((room, p, reply) => {
    const note = room.notes[p.id];
    if (!note) return reply({ ok: false, error: "note not found" });
    if (!isCoord(p.x) || !isCoord(p.y)) return reply({ ok: false, error: "bad position" });

    note.x = p.x;
    note.y = p.y;

    socket.to(room.roomId).emit("note:moved", { id: note.id, x: note.x, y: note.y });
    reply({ ok: true });
  }))

  socket.on("note:delete", guarded((room, p, reply) => {
    if (!room.notes[p.id]) return reply({ ok: false, error: "note not found" });
    delete room.notes[p.id];

    socket.to(room.roomId).emit("note:deleted", { id: p.id });
    reply({ ok: true });
  }))

  // CURSOR SOCKET
  socket.on("cursor:move", guarded((room, p) => {
    if (!isCoord(p.x) || !isCoord(p.y)) return;
    socket.volatile.to(room.roomId).emit("cursor:move", { userId: ctx.userId, x: p.x, y: p.y });
  }))

  // LEAVING SOCKET
  socket.on("disconnect", () => {
    if (ctx.roomId) io.to(ctx.roomId).emit("presence:leave", { userId: ctx.userId });
  });
}