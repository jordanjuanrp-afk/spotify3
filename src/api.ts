import { Track, Playlist } from "./types";

// Auto-detect API host: use same hostname as the page, fallback to localhost
const API_HOST = window.location.hostname || "localhost";
const API_BASE = `http://${API_HOST}:3001/api`;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Tracks
export async function fetchTracks(): Promise<Track[]> {
  return request<Track[]>("/tracks");
}

export async function createTrack(track: Track): Promise<Track> {
  return request<Track>("/tracks", {
    method: "POST",
    body: JSON.stringify(track),
  });
}

export async function updateTrack(id: string, data: Partial<Track>): Promise<Track> {
  return request<Track>(`/tracks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTrack(id: string): Promise<void> {
  await request(`/tracks/${id}`, { method: "DELETE" });
}

// Playlists
export async function fetchPlaylists(): Promise<Playlist[]> {
  return request<Playlist[]>("/playlists");
}

export async function createPlaylist(playlist: Playlist): Promise<Playlist> {
  return request<Playlist>("/playlists", {
    method: "POST",
    body: JSON.stringify(playlist),
  });
}

export async function updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist> {
  return request<Playlist>(`/playlists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  await request(`/playlists/${id}`, { method: "DELETE" });
}
