import { useEffect, useState } from "react";
import { checkServer } from "../api";

export function useHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApiHealth = async () => {
      try {
        const response = await checkServer();
        console.log(response)
        setHealth(response.data.message);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiHealth();
  }, []);

  return { health, loading, error };
}
