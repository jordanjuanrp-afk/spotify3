import React, { useState } from "react";
import { Home, Search, Library, Plus, Heart, Music, ListMusic, User, Volume2, Grid3X3 } from "lucide-react";
import { Playlist } from "../types";

interface SidebarProps {
  playlists: Playlist[];
  currentPlaylistId: string | null;
  onSelectPlaylist: (id: string | null) => void;
  onCreatePlaylist: (name: string, desc: string) => void;
  onOpenAddTrack: () => void;
  likedCount: number;
  activeTab: "home" | "search" | "playlist" | "lyrics" | "gallery";
  setActiveTab: (tab: "home" | "search" | "playlist" | "lyrics" | "gallery") => void;
  isPlayingTrackId?: string;
  isAudioPlaying?: boolean;
}

export default function Sidebar({
  playlists,
  currentPlaylistId,
  onSelectPlaylist,
  onCreatePlaylist,
  onOpenAddTrack,
  likedCount,
  activeTab,
  setActiveTab,
  isPlayingTrackId,
  isAudioPlaying,
}: SidebarProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDesc, setPlaylistDesc] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;
    onCreatePlaylist(playlistName, playlistDesc);
    setPlaylistName("");
    setPlaylistDesc("");
    setShowCreateModal(false);
  };

  return (
    <aside className="hidden md:flex w-56 lg:w-64 bg-black flex-col gap-2 p-2 select-none h-full shrink-0" id="left-sidebar">
      {/* Home & Search links */}
      <div className="bg-[#121212] rounded-lg p-4 flex flex-col gap-4">
        <button
          onClick={() => {
            setActiveTab("home");
            onSelectPlaylist(null);
          }}
          className={`flex items-center gap-4 text-sm font-semibold transition cursor-pointer w-full text-left ${
            activeTab === "home" && currentPlaylistId === null
              ? "text-white"
              : "text-gray-400 hover:text-white"
          }`}
          id="nav-home"
        >
          <Home className="w-6 h-6" />
          <span>Início</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("search");
            onSelectPlaylist(null);
          }}
          className={`flex items-center gap-4 text-sm font-semibold transition cursor-pointer w-full text-left ${
            activeTab === "search"
              ? "text-white"
              : "text-gray-400 hover:text-white"
          }`}
          id="nav-search"
        >
          <Search className="w-6 h-6" />
          <span>Buscar</span>
        </button>

        <button
          onClick={() => {
            setActiveTab("gallery");
            onSelectPlaylist(null);
          }}
          className={`flex items-center gap-4 text-sm font-semibold transition cursor-pointer w-full text-left ${
            activeTab === "gallery"
              ? "text-white"
              : "text-gray-400 hover:text-white"
          }`}
          id="nav-gallery"
        >
          <Grid3X3 className="w-6 h-6" />
          <span>Galeria</span>
        </button>
      </div>

      {/* Library Section */}
      <div className="bg-[#121212] rounded-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 flex items-center justify-between text-gray-400">
          <button
            onClick={() => {
              setActiveTab("home");
              onSelectPlaylist(null);
            }}
            className="flex items-center gap-3 hover:text-white font-semibold text-sm transition cursor-pointer"
            id="lib-header"
          >
            <Library className="w-6 h-6" />
            <span>Sua Biblioteca</span>
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={onOpenAddTrack}
              title="Adicionar Música"
              className="hover:text-white hover:bg-[#1a1a1a] p-1.5 rounded-full transition cursor-pointer"
              id="add-track-btn"
            >
              <Music className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              title="Criar Playlist"
              className="hover:text-white hover:bg-[#1a1a1a] p-1.5 rounded-full transition cursor-pointer"
              id="create-playlist-btn"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-1">
          {/* Liked Songs virtual card */}
          <div
            onClick={() => {
              onSelectPlaylist("liked-songs");
              setActiveTab("playlist");
            }}
            className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition ${
              currentPlaylistId === "liked-songs" ? "bg-[#282828]" : ""
            }`}
            id="liked-songs-item"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-700 via-purple-600 to-pink-500 rounded flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Músicas Curtidas</p>
              <p className="text-xs text-gray-400 font-normal">
                Playlist • {likedCount} {likedCount === 1 ? "música" : "músicas"}
              </p>
            </div>
          </div>

          {/* User playlists */}
          {playlists
            .filter((p) => p.id !== "liked-songs")
            .map((playlist) => {
              const isSelected = currentPlaylistId === playlist.id;
              return (
                <div
                  key={playlist.id}
                  onClick={() => {
                    onSelectPlaylist(playlist.id);
                    setActiveTab("playlist");
                  }}
                  className={`flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition ${
                    isSelected ? "bg-[#282828]" : ""
                  }`}
                  id={`playlist-item-${playlist.id}`}
                >
                  <img
                    src={playlist.cover}
                    alt={playlist.name}
                    className="w-12 h-12 rounded object-cover shadow-sm bg-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-[#1db954]" : "text-white"
                      }`}
                    >
                      {playlist.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate font-normal">
                      {playlist.isCustom ? "Playlist Criada" : "Playlist"} • {playlist.tracks.length} {playlist.tracks.length === 1 ? "faixa" : "faixas"}
                    </p>
                  </div>
                  {isSelected && isAudioPlaying && (
                    <Volume2 className="w-4 h-4 text-[#1db954] shrink-0 animate-bounce" />
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Create Playlist Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] w-full max-w-md p-6 shadow-2xl animate-lightbox-in">
            <h3 className="text-xl font-bold mb-4 text-white">Criar Nova Playlist</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Nome da Playlist</label>
                <input
                  type="text"
                  required
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Minha Playlist #1"
                  className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Descrição (Opcional)</label>
                <textarea
                  value={playlistDesc}
                  onChange={(e) => setPlaylistDesc(e.target.value)}
                  placeholder="Dê uma descrição legal para a sua playlist..."
                  className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954] resize-none h-20"
                />
              </div>
              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-semibold hover:text-white text-gray-400 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#1db954] hover:bg-[#1ed760] text-black px-5 py-2 rounded-full font-bold text-sm cursor-pointer transition"
                >
                  Criar Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
