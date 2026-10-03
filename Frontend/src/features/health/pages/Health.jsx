import { useHealth } from "../hook/useHealth";

const Health = () => {
  const { health, error, loading } = useHealth();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return <div>{health}</div>;
};

export default Health
