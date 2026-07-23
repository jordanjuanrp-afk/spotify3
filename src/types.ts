export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  duration: number; // in seconds
  synthGenre: "techno" | "sertanejo" | "electronic" | "trap" | "pop" | "funk" | "remix" | "slowed";
  lyrics?: Array<{ time: number; text: string }>;
  liked?: boolean;
  isPodcast?: boolean;
  audioFile?: string; // base64 data URL of uploaded audio (local)
  audioUrl?: string; // public URL from Supabase Storage (shared)
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover: string;
  tracks: string[]; // List of Track IDs
  isCustom?: boolean;
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeat: boolean;
  queue: string[]; // Array of Track IDs
  history: string[]; // Array of Track IDs
}
