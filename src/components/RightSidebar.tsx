import React, { useState } from "react";
import { UserPlus, UserCheck, Play, HelpCircle, Film, Radio, Disc } from "lucide-react";
import { Track } from "../types";

interface RightSidebarProps {
  currentTrack: Track | null;
  onPlayTrack: (track: Track) => void;
  allTracks: Track[];
}

export default function RightSidebar({ currentTrack, onPlayTrack, allTracks }: RightSidebarProps) {
  const [following, setFollowing] = useState<Record<string, boolean>>({});

  const toggleFollow = (artist: string) => {
    setFollowing((prev) => ({ ...prev, [artist]: !prev[artist] }));
  };

  // Find related tracks by same artist or genre to display
  const recommendations = allTracks
    .filter(
      (t) =>
        t.id !== currentTrack?.id &&
        (t.artist.includes(currentTrack?.artist || "") ||
          t.synthGenre === currentTrack?.synthGenre)
    )
    .slice(0, 3);

  const artistName = currentTrack ? currentTrack.artist.split(",")[0] : "Artista Desconhecido";
  const isFollowing = following[artistName] || false;

  return (
    <aside className="w-80 bg-black flex flex-col gap-4 p-4 overflow-y-auto select-none border-l border-zinc-900 h-full" id="right-sidebar">
      {currentTrack ? (
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight">Populares - {artistName}</h3>
          </div>

          {/* Big Artwork */}
          <div className="group relative rounded-lg overflow-hidden aspect-square shadow-2xl">
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-zinc-800"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition duration-300" />
          </div>

          {/* Titles */}
          <div>
            <h2 className="text-xl font-extrabold text-white truncate hover:underline cursor-pointer">
              {currentTrack.title}
            </h2>
            <p className="text-sm text-zinc-400 mt-1 truncate">{currentTrack.artist}</p>
          </div>

          {/* Related Video Mockup */}
          <div className="bg-[#181818] p-3 rounded-lg border border-zinc-900 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wide">
              <Film className="w-4 h-4 text-rose-500" />
              <span>Videoclipe relacionado</span>
            </div>
            {/* Mock Video Canvas Animation container */}
            <div className="relative rounded overflow-hidden aspect-video bg-zinc-950 flex items-center justify-center group cursor-pointer border border-zinc-800">
              <img
                src={currentTrack.cover}
                alt="Videoclip mock"
                className="w-full h-full object-cover opacity-40 blur-xs"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                  <Play className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-[10px] text-zinc-300 font-semibold mt-2 bg-black/60 px-2 py-0.5 rounded">
                  Assistir no Player (02:48)
                </span>
              </div>
            </div>
          </div>

          {/* Credits section */}
          <div className="bg-[#181818] p-4 rounded-lg border border-zinc-900 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider block">Créditos</span>
                <span className="text-sm font-bold text-white mt-1 block truncate max-w-[150px]">{artistName}</span>
                <span className="text-xs text-zinc-400 block mt-0.5">Artista Principal</span>
              </div>
              <button
                onClick={() => toggleFollow(artistName)}
                className={`text-xs font-bold px-4 py-2 rounded-full cursor-pointer transition flex items-center gap-1.5 ${
                  isFollowing
                    ? "bg-zinc-800 text-white border border-zinc-700 hover:bg-zinc-750"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Seguindo</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Seguir</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recommendation/Queue suggestion */}
          {recommendations.length > 0 && (
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Recomendados</h4>
              <div className="flex flex-col gap-2">
                {recommendations.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-900 cursor-pointer group transition"
                  >
                    <img
                      src={track.cover}
                      alt={track.title}
                      className="w-10 h-10 rounded object-cover shrink-0 bg-zinc-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate group-hover:text-[#1db954]">{track.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                    <button className="text-zinc-500 hover:text-white transition cursor-pointer p-1">
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3 py-20 text-center">
          <Disc className="w-12 h-12 stroke-1 opacity-40 animate-spin" style={{ animationDuration: "12s" }} />
          <p className="text-sm font-semibold">Toque um som para ver as informações e créditos do artista aqui.</p>
        </div>
      )}
    </aside>
  );
}
