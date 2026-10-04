import { useState } from "react";
import { createRoom } from "../api";
import { saveHostToken, saveName } from "../../../lib/identity";

export function useRoom() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCreateRoom({ name, question }) {
    setLoading(true);
    setError(null);
    try {
      const { data } = await createRoom(question);

      saveName(name);
      saveHostToken(data.roomId, data.hostToken);

      return data.roomId;
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleCreateRoom };
}
