import api from "../../lib/api";

export const checkServer = () => {
  return api.get("/");
};
