// src/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000/api", // make sure backend has /api prefix
  withCredentials: true,
});
