import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://apna-ghar-website.onrender.com";

const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default http;
