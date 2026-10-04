import { useSocket } from "../hooks/useSocket";

const SocketTestPage = () => {
  useSocket();
  return <div>Socket Test</div>;
};

export default SocketTestPage;
