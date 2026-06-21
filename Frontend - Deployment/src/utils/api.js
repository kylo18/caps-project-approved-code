import axios from "axios";
import API_BASE_URL from "../config/api";
import { AUTH_CREDENTIALS } from "./authApi";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export { AUTH_CREDENTIALS };
export default api;
