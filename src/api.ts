import { Track, Playlist } from "./types";
import { supabase } from "./supabase";

const BUCKET_NAME = "audio";

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

export async function uploadAudio(trackId: string, file: File): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const ext = file.name.split(".").pop() || "mp3";
  const path = `${trackId}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return urlData.publicUrl;
}

export async function deleteAudioFromStorage(trackId: string): Promise<void> {
  if (!supabase) return;
  const { data: files } = await supabase.storage.from(BUCKET_NAME).list("", { search: trackId });
  if (files && files.length > 0) {
    const paths = files.filter((f) => f.name.startsWith(trackId)).map((f) => f.name);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET_NAME).remove(paths);
    }
  }
}

// Tracks
export async function fetchTracks(): Promise<Track[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("tracks").select("*");
      if (error) {
        console.error("Supabase fetchTracks error:", error.message, error);
        return localGet<Track[]>("spotify_clone_tracks", []);
      }
      const tracks = (data ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        artist: r.artist,
        album: r.album ?? "",
        cover: r.cover ?? "",
        duration: r.duration ?? 0,
        synthGenre: r.synthGenre ?? "electronic",
        lyrics: r.lyrics ?? undefined,
        liked: r.liked ?? false,
        isPodcast: r.isPodcast ?? false,
        audioUrl: r.audio_url ?? undefined,
      }));
      if (tracks.length > 0) {
        localSet("spotify_clone_tracks", tracks.map((t) => {
          const { audioFile: _af, ...rest } = t as Track & { audioFile?: unknown };
          return rest;
        }));
      }
      return tracks;
    } catch (e) {
      console.error("fetchTracks exception:", e);
      return localGet<Track[]>("spotify_clone_tracks", []);
    }
  }
  return localGet<Track[]>("spotify_clone_tracks", []);
}

export async function createTrack(track: Track, userEmail?: string): Promise<Track> {
  if (supabase) {
    const row: Record<string, unknown> = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      cover: track.cover,
      duration: track.duration,
    };
    if (track.lyrics) row.lyrics = track.lyrics;
    if (track.liked) row.liked = true;
    if (track.isPodcast) row.isPodcast = true;
    if (track.synthGenre) row["synthGenre"] = track.synthGenre;
    if (track.audioUrl) row.audio_url = track.audioUrl;
    if (userEmail) row.user_email = userEmail;

    const { error } = await supabase.from("tracks").upsert(row, { onConflict: "id" });

    if (error) {
      console.warn("createTrack upsert failed, trying insert:", error.message);
      const { error: insertErr } = await supabase.from("tracks").insert(row);
      if (insertErr) {
        console.error("createTrack insert also failed:", insertErr.message);
        throw insertErr;
      }
    }

    return track;
  }
  const tracks = localGet<Track[]>("spotify_clone_tracks", []);
  const idx = tracks.findIndex((t) => t.id === track.id);
  if (idx >= 0) tracks[idx] = track; else tracks.push(track);
  localSet("spotify_clone_tracks", tracks.map(({ audioFile, ...rest }) => rest));
  return track;
}

export async function updateTrack(id: string, data: Partial<Track>): Promise<Track> {
  if (supabase) {
    const update: Record<string, unknown> = {};
    if (data.title !== undefined) update.title = data.title;
    if (data.artist !== undefined) update.artist = data.artist;
    if (data.album !== undefined) update.album = data.album;
    if (data.cover !== undefined) update.cover = data.cover;
    if (data.duration !== undefined) update.duration = data.duration;
    if (data.synthGenre !== undefined) update["synthGenre"] = data.synthGenre;
    if (data.lyrics !== undefined) update.lyrics = data.lyrics;
    if (data.liked !== undefined) update.liked = data.liked;
    if (data.isPodcast !== undefined) update.isPodcast = data.isPodcast;
    if (data.audioUrl) update.audio_url = data.audioUrl;
    const { error } = await supabase.from("tracks").update(update).eq("id", id);
    if (error) throw error;
    return { ...data, id } as Track;
  }
  const tracks = localGet<Track[]>("spotify_clone_tracks", []);
  const idx = tracks.findIndex((t) => t.id === id);
  if (idx >= 0) tracks[idx] = { ...tracks[idx], ...data };
  localSet("spotify_clone_tracks", tracks.map(({ audioFile, ...rest }) => rest));
  return { ...data, id } as Track;
}

export async function deleteTrack(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("tracks").delete().eq("id", id);
    if (error) throw error;
    await deleteAudioFromStorage(id).catch(() => {});
    return;
  }
  const tracks = localGet<Track[]>("spotify_clone_tracks", []);
  localSet("spotify_clone_tracks", tracks.filter((t) => t.id !== id).map(({ audioFile, ...rest }) => rest));
}

// Playlists
export async function fetchPlaylists(): Promise<Playlist[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from("playlists").select("*");
      if (error) {
        console.error("Supabase fetchPlaylists error:", error.message);
        return localGet<Playlist[]>("spotify_clone_playlists", []);
      }
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description ?? undefined,
        cover: r.cover ?? "",
        tracks: r.tracks ?? [],
        isCustom: r.isCustom ?? false,
      }));
    } catch (e) {
      console.error("fetchPlaylists exception:", e);
      return localGet<Playlist[]>("spotify_clone_playlists", []);
    }
  }
  return localGet<Playlist[]>("spotify_clone_playlists", []);
}

export async function createPlaylist(playlist: Playlist): Promise<Playlist> {
  if (supabase) {
    const row: Record<string, unknown> = {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description ?? null,
      cover: playlist.cover,
      tracks: playlist.tracks,
    };
    if (playlist.isCustom) row.isCustom = true;

    const { error } = await supabase.from("playlists").upsert(row, { onConflict: "id" });
    if (error) {
      console.warn("createPlaylist upsert failed, trying insert:", error.message);
      const { error: insertErr } = await supabase.from("playlists").insert(row);
      if (insertErr) {
        console.error("createPlaylist insert also failed:", insertErr.message);
        throw insertErr;
      }
    }
    return playlist;
  }
  const playlists = localGet<Playlist[]>("spotify_clone_playlists", []);
  const idx = playlists.findIndex((p) => p.id === playlist.id);
  if (idx >= 0) playlists[idx] = playlist; else playlists.push(playlist);
  localSet("spotify_clone_playlists", playlists);
  return playlist;
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
  const playlists = localGet<Playlist[]>("spotify_clone_playlists", []);
  const idx = playlists.findIndex((p) => p.id === id);
  if (idx >= 0) playlists[idx] = { ...playlists[idx], ...data };
  localSet("spotify_clone_playlists", playlists);
  return { ...data, id } as Playlist;
}

export async function deletePlaylist(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("playlists").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  const playlists = localGet<Playlist[]>("spotify_clone_playlists", []);
  localSet("spotify_clone_playlists", playlists.filter((p) => p.id !== id));
}
