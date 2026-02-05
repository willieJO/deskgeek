import api from "../utils/api";
export async function isAuthenticated() {
  try {
    const response = await api.get("/usuario/me", { withCredentials: true });
    return response.data?.success === true;
  } catch {
    return false;
  }
}