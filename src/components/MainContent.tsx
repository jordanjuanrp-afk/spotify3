import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Clock,
  Heart,
  Search,
  Music,
  ChevronLeft,
  ChevronRight,
  Bell,
  Users,
  User,
  Plus,
  Check,
  Sparkles,
  Volume2,
  Mic2,
  Trash2,
  Grid3X3,
  LayoutList,
  X,
} from "lucide-react";
import { Track, Playlist } from "../types";
import LiquidHover from "./LiquidHover";

interface MainContentProps {
  activeTab: "home" | "search" | "playlist" | "lyrics" | "gallery" | "profile";
  setActiveTab: (tab: "home" | "search" | "playlist" | "lyrics" | "gallery" | "profile") => void;
  playlists: Playlist[];
  currentPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  allTracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  isAdmin?: boolean;
  onPlayTrack: (track: Track, fromPlaylistId?: string) => void;
  onToggleLiked: (trackId: string) => void;
  onAddTrackToPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  userName?: string;
}

export default function MainContent({
  activeTab,
  setActiveTab,
  playlists,
  currentPlaylistId,
  onSelectPlaylist,
  allTracks,
  currentTrack,
  isPlaying,
  progress,
  isAdmin,
  onPlayTrack,
  onToggleLiked,
  onAddTrackToPlaylist,
  onRemoveTrackFromPlaylist,
  onRemoveTrack,
  onPlayPlaylist,
  userName,
}: MainContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"tudo" | "musica" | "podcasts">("tudo");
  const [preSaved, setPreSaved] = useState<Record<string, boolean>>({});
  const [showPreSaveAlert, setShowPreSaveAlert] = useState<string | null>(null);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);

  // Custom playlist track search (to add tracks to custom playlists)
  const [customSearchQuery, setCustomSearchQuery] = useState("");
  const [playlistViewMode, setPlaylistViewMode] = useState<"list" | "gallery">("list");
  const [lightboxTrack, setLightboxTrack] = useState<Track | null>(null);

  const activePlaylist = useMemo(() => {
    return playlists.find((p) => p.id === currentPlaylistId) || null;
  }, [playlists, currentPlaylistId]);

  // Filter tracks of active playlist
  const playlistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    if (activePlaylist.id === "liked-songs") {
      return allTracks.filter((t) => t.liked);
    }
    return activePlaylist.tracks
      .map((id) => allTracks.find((t) => t.id === id))
      .filter((t): t is Track => !!t);
  }, [activePlaylist, allTracks]);

  // Global search filtering
  const filteredAllTracks = useMemo(() => {
    if (!searchQuery.trim()) return allTracks;
    const q = searchQuery.toLowerCase();
    return allTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [allTracks, searchQuery]);

  // Upcoming release items (from the screenshot)
  const upcomingReleases = [
    {
      id: "pre-1",
      title: "Deu Rolo No Barretão",
      artist: "Guilherme & Benuto, Hugo & Guilherme",
      cover: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=60",
      date: "25 Julho",
    },
    {
      id: "pre-2",
      title: "Vocês & Deus (Ao Vivo)",
      artist: "Zé Neto & Cristiano",
      cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&auto=format&fit=crop&q=60",
      date: "02 Agosto",
    },
    {
      id: "pre-3",
      title: "Além Do Tempo",
      artist: "Léo Foguete",
      cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=60",
      date: "10 Agosto",
    },
    {
      id: "pre-4",
      title: "BATIDA NA ESCURIDÃO",
      artist: "DJ Ari SL, Edy Lemond",
      cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=60",
      date: "18 Agosto",
    },
  ];

  const handlePreSave = (id: string, name: string) => {
    setPreSaved((prev) => ({ ...prev, [id]: !prev[id] }));
    if (!preSaved[id]) {
      setShowPreSaveAlert(name);
      setTimeout(() => setShowPreSaveAlert(null), 3000);
    }
  };

  // Quick 8-grid: show user's tracks (most recent first)
  const quickGridItems = useMemo(() => {
    return [...allTracks].reverse().slice(0, 8);
  }, [allTracks]);

  // Synchronized Lyrics controller
  const lyricScrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLyricRef = useRef<HTMLDivElement>(null);

  const activeLyricIndex = useMemo(() => {
    if (!currentTrack || !currentTrack.lyrics) return -1;
    let index = -1;
    for (let i = 0; i < currentTrack.lyrics.length; i++) {
      if (progress >= currentTrack.lyrics[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTrack, progress]);

  // Smoothly scroll active lyric into center
  useEffect(() => {
    if (activeLyricRef.current && lyricScrollContainerRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeLyricIndex]);

  return (
    <main className="flex-1 bg-zinc-950 rounded-lg overflow-y-auto relative p-3 sm:p-6 flex flex-col gap-4 sm:gap-6 select-none min-w-0" id="main-content-panel">
      {/* HEADER BAR */}
      <header className="flex items-center justify-between sticky top-0 bg-zinc-950/90 backdrop-blur-md py-2 z-20 gap-2" id="main-header">
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button className="bg-black text-gray-400 hover:text-white p-1 sm:p-1.5 rounded-full transition cursor-pointer">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button className="bg-black text-gray-400 hover:text-white p-1 sm:p-1.5 rounded-full transition cursor-pointer">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Conditional search box inside header if tab is search */}
          {activeTab === "search" && (
            <div className="relative ml-2 sm:ml-4 flex-1 max-w-sm">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você quer ouvir?"
                className="bg-zinc-800 text-white placeholder-zinc-400 text-sm pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-white transition"
                id="header-search-input"
              />
            </div>
          )}
        </div>

        {/* User profile / actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button className="hidden sm:block bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs px-4 py-2 rounded-full transition hover:scale-105 cursor-pointer">
            Explorar Premium
          </button>
          <button className="bg-black hover:text-white text-zinc-300 p-1.5 sm:p-2 rounded-full transition cursor-pointer relative">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full" />
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 bg-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full cursor-pointer hover:bg-zinc-900 border border-zinc-800">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] sm:text-xs text-white font-bold">
              J
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white max-w-[60px] sm:max-w-[100px] truncate">{userName || "Usuário"}</span>
          </div>
        </div>
      </header>

      {/* Floating Pre-save Confirmation Alert */}
      {showPreSaveAlert && (
        <div className="fixed top-20 right-10 bg-[#1db954] text-black px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 z-50 font-bold animate-bounce border border-white">
          <Sparkles className="w-5 h-5 fill-current" />
          <span>Pré-salvo: "{showPreSaveAlert}" agendado!</span>
        </div>
      )}

      {/* RENDER ACTIVE VIEW */}
      {activeTab === "home" && currentPlaylistId === null && (
        <>
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType("tudo")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filterType === "tudo" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-zinc-800"
              }`}
            >
              Tudo
            </button>
            <button
              onClick={() => setFilterType("musica")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filterType === "musica" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-zinc-800"
              }`}
            >
              Música
            </button>
            <button
              onClick={() => setFilterType("podcasts")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                filterType === "podcasts" ? "bg-white text-black" : "bg-[#2a2a2a] text-white hover:bg-zinc-800"
              }`}
            >
              Podcasts
            </button>
          </div>

          {/* Quick Grid (8 recently played) */}
          {filterType !== "podcasts" && (
            <section>
              <h2 className="text-2xl font-bold mb-4 text-white" id="recently-played-title">
                Tocados recentemente
              </h2>
              {quickGridItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {quickGridItems.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isThisPlaying = isCurrent && isPlaying;
                  return (
                    <div
                      key={track.id}
                      onClick={() => onPlayTrack(track)}
                      className="bg-zinc-900/60 hover:bg-zinc-800/80 rounded flex items-center overflow-hidden transition-all group relative cursor-pointer"
                      id={`quick-card-${track.id}`}
                    >
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-20 h-20 object-cover shrink-0 bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="p-4 flex-1 min-w-0 pr-12 flex flex-col justify-center">
                        <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                      </div>

                      {/* Playing soundwave animation or Play button */}
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrackToDelete(track);
                            }}
                            className="w-8 h-8 bg-red-600/80 hover:bg-red-500 rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-all shadow-lg"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        {isThisPlaying ? (
                          <div className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg">
                            <Volume2 className="w-5 h-5 text-black animate-pulse" />
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track);
                            }}
                            className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 shadow-lg hover:scale-105"
                          >
                            <Play className="w-5 h-5 text-black fill-current translate-x-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">Adicione músicas para vê-las aqui.</p>
              )}
            </section>
          )}

          {/* Gallery section - User's tracks */}
          {filterType !== "podcasts" && (
            <section className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Sua Galeria</h2>
                {allTracks.length > 4 && (
                  <button
                    onClick={() => setActiveTab("gallery")}
                    className="text-zinc-400 hover:text-white font-bold text-xs transition cursor-pointer"
                  >
                    Mostrar tudo
                  </button>
                )}
              </div>
              {allTracks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {allTracks.slice(0, 8).map((track) => {
                    const isCurrent = currentTrack?.id === track.id;
                    const isThisPlaying = isCurrent && isPlaying;
                    return (
                    <div
                      key={track.id}
                      className="bg-[#181818] hover:bg-zinc-900 rounded-lg overflow-hidden transition duration-300 group flex flex-col cursor-pointer"
                    >
                      <div
                        className="relative aspect-square overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxTrack(track);
                        }}
                      >
                          <img
                            src={track.cover}
                            alt={track.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          {/* Dark gradient overlay at bottom */}
                          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                          {/* Badge */}
                          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-1 rounded font-semibold">
                            {track.album || track.synthGenre}
                          </div>
                          {/* Floating play / now playing */}
                          <div className="absolute bottom-2 right-2">
                            {isThisPlaying ? (
                              <button className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-xl">
                                <Volume2 className="w-5 h-5 text-black animate-pulse" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPlayTrack(track);
                                }}
                                className="w-10 h-10 bg-[#1db954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 shadow-xl hover:scale-105"
                              >
                                <Play className="w-5 h-5 fill-current translate-x-0.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="p-3 flex flex-col gap-1">
                          <h3 className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>{track.title}</h3>
                          <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track);
                            }}
                            className="mt-2 w-full text-xs font-bold py-2 rounded-full cursor-pointer flex items-center justify-center gap-1.5 bg-white text-black hover:bg-zinc-200 transition-all"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Ouvir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic">Adicione músicas para vê-las aqui.</p>
              )}
            </section>
          )}

          {/* Curated section (Feito para Jordynesjuan) */}
          <section className="mt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">Feito para {userName || "você"}</h2>
              <button className="text-zinc-400 hover:text-white font-bold text-xs transition">Mostrar tudo</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {playlists
                .filter((p) => p.id !== "liked-songs")
                .slice(0, 5)
                .map((playlist) => (
                  <div
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist.id)}
                    className="bg-[#181818] hover:bg-[#282828] rounded-lg p-4 cursor-pointer transition duration-300 group flex flex-col"
                  >
                    <div className="relative rounded overflow-hidden aspect-square mb-4 shadow-lg">
                      <img
                        src={playlist.cover}
                        alt={playlist.name}
                        className="w-full h-full object-cover bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(playlist);
                        }}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-[#1db954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 shadow-xl hover:scale-105"
                      >
                        <Play className="w-5 h-5 fill-current translate-x-0.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-white truncate">{playlist.name}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1.5 leading-relaxed font-normal">
                      {playlist.description || "Aproveite esta playlist selecionada especialmente para você."}
                    </p>
                  </div>
                ))}
            </div>
          </section>
        </>
      )}

      {/* SEARCH VIEW */}
      {activeTab === "search" && (
        <section className="flex flex-col gap-6">
          {searchQuery.trim() ? (
            <div>
              <h2 className="text-xl font-bold mb-4 text-white">Resultados para "{searchQuery}"</h2>
              <div className="bg-[#181818] rounded-lg p-2">
                {filteredAllTracks.length > 0 ? (
                  <div className="flex flex-col">
                    {filteredAllTracks.map((track, i) => {
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={track.id}
                          onClick={() => onPlayTrack(track)}
                          className="flex items-center gap-4 p-3 rounded-md hover:bg-zinc-800/60 cursor-pointer group transition"
                        >
                          <span className="text-sm text-zinc-500 w-4 text-right font-medium">{i + 1}</span>
                          <img
                            src={track.cover}
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover bg-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                          </div>
                          <span className="text-xs text-zinc-500 font-medium">{track.album}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleLiked(track.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                          >
                            <Heart className={`w-4 h-4 ${track.liked ? "text-[#1db954] fill-[#1db954]" : ""}`} />
                           </button>
                           <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                   setTrackToDelete(track);
                                }}
                                className="md:opacity-0 md:group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                       );
                     })}
                   </div>
                ) : (
                  <p className="text-sm text-zinc-400 p-6 text-center">Nenhuma música encontrada.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              {/* Show uploaded tracks library */}
              {allTracks.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">Sua Biblioteca</h2>
                  <div className="bg-[#181818] rounded-lg p-2">
                    <div className="flex flex-col">
                      {allTracks.map((track, i) => {
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                          <div
                            key={track.id}
                            onClick={() => onPlayTrack(track)}
                            className="flex items-center gap-4 p-3 rounded-md hover:bg-zinc-800/60 cursor-pointer group transition"
                          >
                            <span className="text-sm text-zinc-500 w-4 text-right font-medium">{i + 1}</span>
                            <img
                              src={track.cover}
                              alt={track.title}
                              className="w-10 h-10 rounded object-cover bg-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                                {track.title}
                              </p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium">{track.album}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLiked(track.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                            >
                              <Heart className={`w-4 h-4 ${track.liked ? "text-[#1db954] fill-[#1db954]" : ""}`} />
                            </button>
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackToDelete(track);
                                }}
                                className="md:opacity-0 md:group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Genre categories */}
              <div>
                <h2 className="text-xl font-bold mb-4 text-white">Navegar por todas as seções</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[
                    { title: "Sertanejo", bg: "bg-emerald-700", cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=200&auto=format&fit=crop&q=60" },
                    { title: "Eletrofunk", bg: "bg-indigo-700", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=60" },
                    { title: "Techno & Rave", bg: "bg-red-700", cover: "https://images.unsplash.com/photo-1482440308425-276ad0f28b19?w=200&auto=format&fit=crop&q=60" },
                    { title: "Trap BR", bg: "bg-amber-600", cover: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=200&auto=format&fit=crop&q=60" },
                    { title: "Treino pesado", bg: "bg-pink-700", cover: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200&auto=format&fit=crop&q=60" },
                    { title: "Lançamentos", bg: "bg-blue-700", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop&q=60" },
                    { title: "Podcasts", bg: "bg-purple-800", cover: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=60" },
                    { title: "Pop Brasil", bg: "bg-teal-600", cover: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200&auto=format&fit=crop&q=60" },
                  ].map((cat, i) => (
                    <div
                      key={i}
                      className={`${cat.bg} rounded-lg aspect-square p-4 relative overflow-hidden cursor-pointer hover:scale-105 transition-transform duration-300 shadow-lg`}
                      onClick={() => {
                        setSearchQuery(cat.title);
                      }}
                    >
                      <span className="text-lg font-bold text-white break-words">{cat.title}</span>
                      <img
                        src={cat.cover}
                        alt={cat.title}
                        className="w-16 h-16 object-cover rounded shadow-md absolute -bottom-2 -right-2 rotate-[25deg] transform hover:scale-110 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* PLAYLIST DETAIL VIEW */}
      {activeTab === "playlist" && activePlaylist && (
        <section className="flex flex-col gap-6" id={`playlist-detail-${activePlaylist.id}`}>
          {/* Hero Header */}
          <div className="flex flex-col sm:flex-row gap-6 items-end relative pb-2 border-b border-zinc-800/50">
            {/* Gradient backdrop */}
            <div className="absolute inset-x-0 -top-6 h-60 bg-gradient-to-b from-indigo-900/30 to-transparent pointer-events-none rounded-t-lg -z-10" />

            <img
              src={activePlaylist.cover}
              alt={activePlaylist.name}
              className="w-48 h-48 rounded object-cover shadow-2xl bg-zinc-800"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {activePlaylist.isCustom ? "Playlist Criada" : "Playlist"}
              </span>
              <h1 className="text-4xl sm:text-6xl font-extrabold text-white mt-2 tracking-tight">
                {activePlaylist.name}
              </h1>
              <p className="text-zinc-400 text-sm mt-3 leading-relaxed font-normal">
                {activePlaylist.description || "Aproveite esta seleção de faixas exclusivas brasileiras."}
              </p>
              <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-zinc-300">
                <span className="text-white">{userName || "Usuário"}</span>
                <span>•</span>
                <span>{playlistTracks.length} {playlistTracks.length === 1 ? "música" : "músicas"}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-4">
            {playlistTracks.length > 0 ? (
              <button
                onClick={() => onPlayPlaylist(activePlaylist)}
                className="w-12 h-12 bg-[#1db954] hover:bg-[#1ed760] text-black rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
              >
                <Play className="w-6 h-6 fill-current translate-x-0.5" />
              </button>
            ) : (
              <div className="text-sm text-zinc-500 italic">Adicione músicas abaixo para começar a tocar</div>
            )}
            {playlistTracks.length > 0 && (
              <div className="flex items-center bg-zinc-900 rounded-full p-1 ml-auto">
                <button
                  onClick={() => setPlaylistViewMode("list")}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    playlistViewMode === "list"
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Visualização em lista"
                >
                  <LayoutList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPlaylistViewMode("gallery")}
                  className={`p-2 rounded-full transition cursor-pointer ${
                    playlistViewMode === "gallery"
                      ? "bg-zinc-700 text-white"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title="Visualização em galeria"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Tracks Table or Gallery */}
          {playlistTracks.length > 0 && playlistViewMode === "list" && (
            <div className="flex flex-col" id="playlist-tracks-table">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_1fr_80px] px-4 py-2 text-xs text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 mb-2">
                <span>#</span>
                <span>Título</span>
                <span>Álbum</span>
                <span className="flex justify-end pr-2">
                  <Clock className="w-4 h-4" />
                </span>
              </div>

              {/* Rows */}
              {playlistTracks.map((track, i) => {
                const isCurrent = currentTrack?.id === track.id;
                const isThisPlaying = isCurrent && isPlaying;
                const min = Math.floor(track.duration / 60);
                const sec = Math.floor(track.duration % 60);

                return (
                  <div
                    key={track.id}
                    onDoubleClick={() => onPlayTrack(track, activePlaylist.id)}
                    className="grid grid-cols-[40px_1fr_1fr_80px] px-4 py-3 rounded-md hover:bg-zinc-800/40 group items-center cursor-pointer transition"
                    id={`track-row-${track.id}`}
                  >
                    {/* Index or Play trigger */}
                    <div className="text-zinc-400 font-medium text-sm">
                      <span className="group-hover:hidden">{i + 1}</span>
                      <button
                        onClick={() => onPlayTrack(track, activePlaylist.id)}
                        className="hidden group-hover:block hover:text-white"
                      >
                        {isThisPlaying ? (
                          <Pause className="w-4 h-4 text-[#1db954] fill-current" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-current" />
                        )}
                      </button>
                    </div>

                    {/* Title & Artist */}
                    <div className="flex items-center gap-3 pr-4">
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>

                    {/* Album */}
                    <span className="text-sm text-zinc-400 truncate">{track.album}</span>

                    {/* Like, Remove & Duration */}
                    <div className="flex items-center justify-end gap-3 pr-2">
                      <button
                        onClick={() => onToggleLiked(track.id)}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-white transition cursor-pointer p-1"
                      >
                        <Heart className={`w-4 h-4 ${track.liked ? "text-[#1db954] fill-[#1db954]" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                                   setTrackToDelete(track);
                                }}
                                className="md:opacity-0 md:group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                      <span className="text-xs text-zinc-400 font-medium">
                        {min}:{sec < 10 ? "0" : ""}
                        {sec}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Gallery Grid View for Playlist */}
          {playlistTracks.length > 0 && playlistViewMode === "gallery" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {playlistTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isThisPlaying = isCurrent && isPlaying;
                return (
                  <div
                    key={track.id}
                    className="bg-[#181818] hover:bg-zinc-900 rounded-lg overflow-hidden transition duration-300 group flex flex-col cursor-pointer"
                    id={`gallery-card-${track.id}`}
                  >
                    <div
                      className="relative aspect-square overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxTrack(track);
                      }}
                    >
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark gradient overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                      {/* Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-1 rounded font-semibold">
                        {track.album || track.synthGenre}
                      </div>
                      {/* Floating play / now playing */}
                      <div className="absolute bottom-2 right-2">
                        {isThisPlaying ? (
                          <button className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-xl">
                            <Volume2 className="w-5 h-5 text-black animate-pulse" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track, activePlaylist.id);
                            }}
                            className="w-10 h-10 bg-[#1db954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 shadow-xl hover:scale-105"
                          >
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom playlists can search and ADD new tracks! */}
          {activePlaylist.isCustom && (
            <div className="mt-8 border-t border-zinc-800 pt-6">
              <h3 className="text-lg font-bold text-white mb-2">Vamos adicionar algumas faixas à sua nova playlist</h3>
              <div className="relative max-w-md mb-4">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  placeholder="Pesquisar faixas pelo nome ou artista..."
                  className="bg-zinc-900 border border-zinc-800 text-sm rounded-md pl-9 pr-4 py-2 w-full text-white focus:outline-none focus:ring-1 focus:ring-[#1db954]"
                />
              </div>

              {/* Show recommendation list to add */}
              <div className="flex flex-col bg-zinc-900/40 rounded-lg p-2 max-h-60 overflow-y-auto border border-zinc-900">
                {allTracks
                  .filter(
                    (t) =>
                      // don't repeat tracks already in this playlist
                      !activePlaylist.tracks.includes(t.id) &&
                      (t.title.toLowerCase().includes(customSearchQuery.toLowerCase()) ||
                        t.artist.toLowerCase().includes(customSearchQuery.toLowerCase()))
                  )
                  .map((track) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-zinc-800/40 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={track.cover}
                          alt={track.title}
                          className="w-10 h-10 rounded object-cover bg-zinc-800"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <p className="text-sm font-semibold text-white">{track.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{track.artist}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => onAddTrackToPlaylist(activePlaylist.id, track.id)}
                        className="border border-zinc-700 hover:border-white text-xs font-bold px-3 py-1.5 rounded-full text-white hover:scale-105 transition cursor-pointer"
                      >
                        Adicionar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* GALLERY VIEW - All tracks as cover art grid */}
      {activeTab === "gallery" && currentPlaylistId === null && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Galeria</h2>
            <span className="text-sm text-zinc-400">{allTracks.length} {allTracks.length === 1 ? "música" : "músicas"}</span>
          </div>

          {allTracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {allTracks.map((track) => {
                const isCurrent = currentTrack?.id === track.id;
                const isThisPlaying = isCurrent && isPlaying;
                return (
                  <div
                    key={track.id}
                    className="bg-[#181818] hover:bg-zinc-900 rounded-lg overflow-hidden transition duration-300 group flex flex-col cursor-pointer"
                    id={`gallery-all-${track.id}`}
                  >
                    <div
                      className="relative aspect-square overflow-hidden cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxTrack(track);
                      }}
                    >
                      <img
                        src={track.cover}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      {/* Dark gradient overlay at bottom */}
                      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
                      {/* Badge */}
                      <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm text-[10px] text-zinc-300 px-2 py-1 rounded font-semibold">
                        {track.album || track.synthGenre}
                      </div>
                      {/* Floating play / now playing */}
                      <div className="absolute bottom-2 right-2">
                        {isThisPlaying ? (
                          <button className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center shadow-xl">
                            <Volume2 className="w-5 h-5 text-black animate-pulse" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track);
                            }}
                            className="w-10 h-10 bg-[#1db954] text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 shadow-xl hover:scale-105"
                          >
                            <Play className="w-5 h-5 fill-current translate-x-0.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="p-3 flex flex-col gap-1">
                      <p className={`text-sm font-bold truncate ${isCurrent ? "text-[#1db954]" : "text-white"}`}>
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLiked(track.id);
                          }}
                          className="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
                        >
                          <Heart className={`w-4 h-4 ${track.liked ? "text-[#1db954] fill-[#1db954]" : ""}`} />
                        </button>
                        <button
                            onClick={(e) => {
                              e.stopPropagation();
                                   setTrackToDelete(track);
                                }}
                                className="md:opacity-0 md:group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Grid3X3 className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg font-semibold">Nenhuma música na galeria</p>
              <p className="text-sm mt-1">Adicione músicas para vê-las aqui em formato galeria.</p>
            </div>
          )}
        </section>
      )}

      {/* FULL SYNCHRONIZED KARAOKE LYRICS SCREEN */}
      {activeTab === "lyrics" && (
        <section
          ref={lyricScrollContainerRef}
          className="flex-1 overflow-y-auto px-4 md:px-12 py-8 rounded-lg flex flex-col gap-6 relative"
          style={{
            background: "linear-gradient(to bottom, #101030 0%, #050510 100%)",
          }}
          id="lyrics-screen-panel"
        >
          {/* Ambient Blurred cover glow in background */}
          {currentTrack && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
          )}

          {currentTrack ? (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
              {/* Header header track */}
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <img
                  src={currentTrack.cover}
                  alt={currentTrack.title}
                  className="w-16 h-16 rounded object-cover shadow-2xl bg-zinc-800"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h2 className="text-lg font-bold text-white">{currentTrack.title}</h2>
                  <p className="text-sm text-zinc-400">{currentTrack.artist}</p>
                </div>
              </div>

              {/* Lyrics List container */}
              <div className="flex flex-col gap-5 py-4 pb-20">
                {currentTrack.lyrics && currentTrack.lyrics.length > 0 ? (
                  currentTrack.lyrics.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    const isPassed = idx < activeLyricIndex;

                    return (
                      <div
                        key={idx}
                        ref={isActive ? activeLyricRef : null}
                        className={`text-2xl md:text-3.5xl font-extrabold tracking-tight transition-all duration-300 leading-snug cursor-pointer py-1 ${
                          isActive
                            ? "text-[#1db954] scale-[1.03] origin-left drop-shadow-[0_0_15px_rgba(29,185,84,0.2)]"
                            : isPassed
                            ? "text-white/80"
                            : "text-white/20 hover:text-white/40"
                        }`}
                      >
                        {line.text}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xl text-zinc-400 italic text-center py-20">
                    Letra da música indisponível.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-20">
              <Mic2 className="w-16 h-16 mb-4 opacity-40 animate-pulse" />
              <p className="text-lg font-semibold">Nenhuma música tocando</p>
              <p className="text-sm mt-1">Abra a letra de um som tocando para cantar junto!</p>
            </div>
          )}
        </section>
      )}

      {/* LIGHTBOX - Full image view with cinematic red effect */}
      {lightboxTrack && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxTrack(null)}
        >
          <button
            onClick={() => setLightboxTrack(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition cursor-pointer z-10"
          >
            <X className="w-7 h-7" />
          </button>

          <div
            className="relative max-w-lg w-full shadow-2xl animate-lightbox-in overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main image with liquid distortion */}
            <div className="relative aspect-square overflow-hidden bg-black">
              {/* Fallback cover image behind the liquid effect */}
              <img
                src={lightboxTrack.cover}
                alt={lightboxTrack.title}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Liquid distortion effect overlay */}
              <div className="absolute inset-0 z-10">
                <LiquidHover
                  imageSrc={lightboxTrack.cover}
                  resolution={10}
                  cursorSize={50}
                  intensity={50}
                />
              </div>

              {/* Track title overlay - bottom left like "CRY" in the image */}
              <div className="absolute bottom-4 left-4 z-20">
                <span className="text-white/90 text-sm font-bold tracking-widest uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                  {lightboxTrack.title}
                </span>
              </div>

              {/* Vignette */}
              <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.6)] pointer-events-none z-20" />
            </div>

            {/* Info bar below image */}
            <div className="bg-[#0a0a0a] p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{lightboxTrack.artist}</p>
                <p className="text-xs text-red-400/70 truncate mt-0.5">{lightboxTrack.album || lightboxTrack.synthGenre}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleLiked(lightboxTrack.id)}
                  className="text-zinc-400 hover:text-white transition p-2 cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${lightboxTrack.liked ? "text-[#1db954] fill-[#1db954]" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    onPlayTrack(lightboxTrack);
                    setLightboxTrack(null);
                  }}
                  className="bg-[#1db954] hover:bg-[#1ed760] text-black w-10 h-10 rounded-full flex items-center justify-center transition cursor-pointer shadow-lg"
                >
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {trackToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Apagar música?</h3>
                <p className="text-xs text-zinc-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <div className="bg-[#2a2a2a] rounded-lg p-3 mb-5">
              <p className="text-sm font-bold text-white truncate">{trackToDelete.title}</p>
              <p className="text-xs text-zinc-400 truncate">{trackToDelete.artist}</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setTrackToDelete(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onRemoveTrack(trackToDelete.id);
                  setTrackToDelete(null);
                }}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-full font-bold text-sm cursor-pointer transition"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
