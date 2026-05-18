// Hardcode your Vercel URL as the production fallback
export const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" 
    ? "https://shop-server-6rxo.vercel.app" 
    : "http://localhost:5000");

export const SUPABASE_URL =
  process.env.REACT_APP_SUPABASE_URL ||
  "https://eoyyabbyglfhmjcocykr.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVveXlhYmJ5Z2xmaG1qY29jeWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NzEwMTMsImV4cCI6MjA5MzQ0NzAxM30.HKpF-IkvTegijfPAgX7bc2dZPyDCND46QrqJ2V24g64";

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}