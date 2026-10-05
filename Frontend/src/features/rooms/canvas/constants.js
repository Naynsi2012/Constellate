export const PHASE_RULES = {
  diverge: { noteCreate: true, noteEdit: true, noteMove: "author", edges: true, clusters: false, vote: false },
  cluster: { noteCreate: true, noteEdit: true, noteMove: "anyone", edges: true, clusters: true, vote: false },
  converge: { noteCreate: false, noteEdit: false, noteMove: "none", edges: false, clusters: false, vote: true },
};

export const NOTE_WIDTH = 180;
export const NOTE_PAD = 10;
export const SEMANTIC_ZOOM_THRESHOLD = 0.6;
export const MIN_ZOOM = 0.12;
export const MAX_ZOOM = 2.5;

export function canEditNote(note, you, phase) {
  if (!PHASE_RULES[phase]?.noteEdit) return false;
  if (note.type === "question") return you.isHost;
  return note.authorId === you.userId;
}

export function canDeleteNote(note, you) {
  if (note.type === "question") return false;
  return note.authorId === you.userId || you.isHost;
}

export function canMoveNote(note, you, phase) {
  const rule = PHASE_RULES[phase]?.noteMove;
  if (!rule || rule === "none") return false;
  if (note.type === "question") return you.isHost;
  if (rule === "anyone") return true;
  return note.authorId === you.userId || you.isHost;
}

export function glowIntensity(voteCount, maxVotes) {
  if (!maxVotes || voteCount <= 0) return 0;
  return Math.min(0.25 + (voteCount / maxVotes) * 0.75, 1);
}

export function countVotes(votes) {
  const perNote = {};
  const perCluster = {};
  for (const vote of votes) {
    const map = vote.targetType === "cluster" ? perCluster : perNote;
    map[vote.targetId] = (map[vote.targetId] ?? 0) + 1;
  }
  return { perNote, perCluster };
}
