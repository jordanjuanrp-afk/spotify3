import { Track, Playlist } from "./types";
import { supabase } from "./supabase";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const API_BASE = import.meta.env.VITE_API_URL || "/api";
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// LocalStorage helpers
function localGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function localSet(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Tracks
export async function fetchTracks(): Promise<Track[]> {
  if (supabase) {
    const { data, error } = await supabase.from("tracks").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      artist: r.artist,
      album: r.album,
      cover: r.cover,
      duration: r.duration,
      synthGenre: r.synthGenre,
      lyrics: r.lyrics ?? undefined,
      liked: r.liked ?? false,
      isPodcast: r.isPodcast ?? false,
    }));
  }
  return localGet<Track[]>("spotify_clone_tracks", []);
}

export async function createTrack(track: Track): Promise<Track> {
  if (supabase) {
    const { audioFile, ...rest } = track;
    const { error } = await supabase.from("tracks").insert({
      id: rest.id,
      title: rest.title,
      artist: rest.artist,
      album: rest.album,
      cover: rest.cover,
      duration: rest.duration,
      synthGenre: rest.synthGenre,
      lyrics: rest.lyrics ?? null,
      liked: rest.liked ?? false,
      isPodcast: rest.isPodcast ?? false,
    });
    if (error) throw error;
    return track;
  }
  return request<Track>("/tracks", {
    method: "POST",
    body: JSON.stringify(track),
  }).catch(() => track);
}

export async function updateTrack(id: string, data: Partial<Track>): Promise<Track> {
  if (supabase) {
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.artist !== undefined) update.artist = data.artist;
    if (data.album !== undefined) update.album = data.album;
    if (data.cover !== undefined) update.cover = data.cover;
    if (data.duration !== undefined) update.duration = data.duration;
    if (data.synthGenre !== undefined) update.synthGenre = data.synthGenre;
    if (data.lyrics !== undefined) update.lyrics = data.lyrics;
    if (data.liked !== undefined) update.liked = data.liked;
    if (data.isPodcast !== undefined) update.isPodcast = data.isPodcast;
    const { error } = await supabase.from("tracks").update(update).eq("id", id);
    if (error) throw error;
    return { ...data, id } as Track;
  }
  return request<Track>(`/tracks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTrack(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await request(`/tracks/${id}`, { method: "DELETE" });
}

// Playlists
export async function fetchPlaylists(): Promise<Playlist[]> {
  if (supabase) {
    const { data, error } = await supabase.from("playlists").select("*");
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? undefined,
      cover: r.cover,
      tracks: r.tracks ?? [],
      isCustom: r.isCustom ?? false,
    }));
  }
  return localGet<Playlist[]>("spotify_clone_playlists", []);
}

export async function createPlaylist(playlist: Playlist): Promise<Playlist> {
  if (supabase) {
    const { error } = await supabase.from("playlists").insert({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? null,
      cover: playlist.cover,
      tracks: playlist.tracks,
      isCustom: playlist.isCustom ?? false,
    });
    if (error) throw error;
    return playlist;
  }
  return request<Playlist>("/playlists", {
    method: "POST",
    body: JSON.stringify(playlist),
  }).catch(() => playlist);
}

export async function updatePlaylist(id: string, data: Partial<Playlist>): Promise<Playlist> {
  if (supabase) {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.cover !== undefined) update.cover = data.cover;
    if (data.tracks !== undefined) update.tracks = data.tracks;
    if (data.isCustom !== undefined) update.isCustom = data.isCustom;
    const { error } = await supabase.from("playlists").update(update).eq("id", id);
    if (error) throw error;
    return { ...data, id } as Playlist;
  }
  return request<Playlist>(`/playlists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePlaylist(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await request(`/playlists/${id}`, { method: "DELETE" });
}
