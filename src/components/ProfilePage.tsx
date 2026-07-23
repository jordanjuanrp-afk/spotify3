import React from "react";
import { User, Music, Heart, ListMusic, Clock, LogOut, Mail, Settings } from "lucide-react";
import { Track, Playlist } from "../types";

interface ProfilePageProps {
  userName: string;
  userEmail: string;
  allTracks: Track[];
  playlists: Playlist[];
  onLogout: () => void;
}

export default function ProfilePage({
  userName,
  userEmail,
  allTracks,
  playlists,
  onLogout,
}: ProfilePageProps) {
  const likedCount = allTracks.filter((t) => t.liked).length;
  const customPlaylists = playlists.filter((p) => p.isCustom);
  const totalDuration = allTracks.reduce((acc, t) => acc + t.duration, 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#1db954] rounded-full flex items-center justify-center shadow-lg shadow-[#1db954]/20">
          <span className="text-black font-bold text-3xl sm:text-4xl">
            {userName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-xs text-zinc-400 uppercase font-semibold">Perfil</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{userName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <p className="text-sm text-zinc-400">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-[#181818] rounded-xl p-4 border border-[#2a2a2a]">
          <Music className="w-5 h-5 text-[#1db954] mb-2" />
          <p className="text-2xl font-bold text-white">{allTracks.length}</p>
          <p className="text-xs text-zinc-400">Músicas</p>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 border border-[#2a2a2a]">
          <Heart className="w-5 h-5 text-pink-500 mb-2" />
          <p className="text-2xl font-bold text-white">{likedCount}</p>
          <p className="text-xs text-zinc-400">Curtidas</p>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 border border-[#2a2a2a]">
          <ListMusic className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold text-white">{customPlaylists.length}</p>
          <p className="text-xs text-zinc-400">Playlists</p>
        </div>
        <div className="bg-[#181818] rounded-xl p-4 border border-[#2a2a2a]">
          <Clock className="w-5 h-5 text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-white">{hours}h {minutes}m</p>
          <p className="text-xs text-zinc-400">Tempo total</p>
        </div>
      </div>

      {/* Settings Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configurações
        </h2>
        <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
            <User className="w-4 h-4 text-zinc-400" />
            <div className="flex-1">
              <p className="text-sm text-white">Nome</p>
              <p className="text-xs text-zinc-500">{userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a]">
            <Mail className="w-4 h-4 text-zinc-400" />
            <div className="flex-1">
              <p className="text-sm text-white">Email</p>
              <p className="text-xs text-zinc-500">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-semibold">Sair da conta</span>
          </button>
        </div>
      </div>

      {/* Recent Tracks */}
      {allTracks.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-white mb-3">Suas Músicas</h2>
          <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] overflow-hidden">
            {allTracks.slice(0, 5).map((track, i) => (
              <div
                key={track.id}
                className={`flex items-center gap-3 px-4 py-3 ${
                  i < allTracks.slice(0, 5).length - 1 ? "border-b border-[#2a2a2a]" : ""
                }`}
              >
                <img
                  src={track.cover}
                  alt={track.title}
                  className="w-10 h-10 rounded object-cover bg-zinc-800"
                  referrerPolicy="no-referrer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{track.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-zinc-500">
                  {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                </span>
              </div>
            ))}
            {allTracks.length > 5 && (
              <div className="px-4 py-2 text-center">
                <p className="text-xs text-zinc-500">+{allTracks.length - 5} músicas</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
