import { Track, Playlist } from "./types";

export const INITIAL_TRACKS: Track[] = [];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: "liked-songs",
    name: "Músicas Curtidas",
    description: "Sua coleção pessoal de faixas favoritas.",
    cover: "https://images.unsplash.com/photo-1513829096999-4978602297f7?w=300&auto=format&fit=crop&q=60",
    tracks: [],
  },
];
