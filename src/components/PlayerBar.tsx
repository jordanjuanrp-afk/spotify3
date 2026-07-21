import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Laptop2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Track } from "../types";

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  progress: number;
  onProgressChange: (value: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeat: boolean;
  onToggleRepeat: () => void;
  onToggleLiked: (trackId: string) => void;
  isLiked: boolean;
  activeLyrics: boolean;
  onToggleLyrics: () => void;
  activeRightSidebar: boolean;
  onToggleRightSidebar: () => void;
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrevious,
  progress,
  onProgressChange,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  shuffle,
  onToggleShuffle,
  repeat,
  onToggleRepeat,
  onToggleLiked,
  isLiked,
  activeLyrics,
  onToggleLyrics,
  activeRightSidebar,
  onToggleRightSidebar,
}: PlayerBarProps) {
  // Helper to format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const duration = currentTrack ? currentTrack.duration : 0;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <footer className="h-20 bg-black border-t border-zinc-900 px-4 flex items-center justify-between select-none" id="player-bar">
      {/* LEFT: Current Track Info */}
      <div className="flex items-center gap-3 w-[30%] min-w-[180px]">
        {currentTrack ? (
          <>
            <img
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-14 h-14 rounded object-cover shadow-md bg-zinc-800"
              referrerPolicy="no-referrer"
              onClick={onToggleRightSidebar}
            />
            <div className="flex-1 min-w-0">
              <h4
                className="text-sm font-semibold text-white truncate hover:underline cursor-pointer"
                onClick={onToggleRightSidebar}
              >
                {currentTrack.title}
              </h4>
              <p className="text-xs text-gray-400 truncate hover:underline cursor-pointer">
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => onToggleLiked(currentTrack.id)}
              className="text-gray-400 hover:text-white transition cursor-pointer"
              id="like-track-btn"
            >
              <Heart
                className={`w-5 h-5 transition-transform active:scale-125 ${
                  isLiked ? "text-[#1db954] fill-[#1db954]" : "text-gray-400 hover:text-white"
                }`}
              />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-[#282828] rounded flex items-center justify-center">
              <Mic2 className="w-6 h-6 text-zinc-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-500">Nenhuma música</p>
              <p className="text-xs text-zinc-600">Selecione para tocar</p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER: Player Controls & Timeline */}
      <div className="flex flex-col items-center gap-1.5 max-w-[45%] w-[40%]">
        {/* Buttons */}
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleShuffle}
            disabled={!currentTrack}
            className={`transition cursor-pointer ${
              shuffle ? "text-[#1db954] hover:text-[#1ed760]" : "text-zinc-400 hover:text-white"
            } disabled:opacity-50`}
            title="Ordem Aleatória"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevious}
            disabled={!currentTrack}
            className="text-zinc-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
            title="Anterior"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={!currentTrack}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!currentTrack}
            className="text-zinc-400 hover:text-white transition disabled:opacity-50 cursor-pointer"
            title="Próxima"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            disabled={!currentTrack}
            className={`transition cursor-pointer ${
              repeat ? "text-[#1db954] hover:text-[#1ed760]" : "text-zinc-400 hover:text-white"
            } disabled:opacity-50`}
            title="Repetir"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="w-full flex items-center gap-2 text-xs text-zinc-400">
          <span className="w-8 text-right font-normal">{formatTime(progress)}</span>
          <div className="relative flex-1 group py-2">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={progress}
              onChange={(e) => onProgressChange(Number(e.target.value))}
              disabled={!currentTrack}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-default"
            />
            {/* Custom Track Background */}
            <div className="w-full h-1 bg-[#2c2c2c] rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-300 group-hover:bg-[#1db954] transition-colors rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* Custom Thumb handle on hover */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity pointer-events-none"
              style={{ left: `calc(${progressPercent}% - 5px)` }}
            />
          </div>
          <span className="w-8 text-left font-normal">{formatTime(duration)}</span>
        </div>
      </div>

      {/* RIGHT: Extra controls (Lyrics, Volume, Fullscreen) */}
      <div className="flex items-center gap-3 w-[30%] justify-end min-w-[180px] text-zinc-400">
        <button
          onClick={onToggleLyrics}
          disabled={!currentTrack}
          className={`transition cursor-pointer p-1 rounded-full ${
            activeLyrics ? "text-[#1db954] bg-zinc-900" : "hover:text-white"
          } disabled:opacity-50`}
          title="Letra da Música"
        >
          <Mic2 className="w-4.5 h-4.5" />
        </button>

        <button
          onClick={onToggleRightSidebar}
          className={`transition cursor-pointer p-1 rounded-full ${
            activeRightSidebar ? "text-[#1db954] bg-zinc-900" : "hover:text-white"
          }`}
          title="Informações do Artista"
        >
          <Laptop2 className="w-4.5 h-4.5" />
        </button>

        {/* Volume controls */}
        <div className="flex items-center gap-2 max-w-[120px] w-full">
          <button
            onClick={onToggleMute}
            className="hover:text-white transition cursor-pointer shrink-0"
            title={isMuted ? "Ativar som" : "Desativar som"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4.5 h-4.5" />
            ) : (
              <Volume2 className="w-4.5 h-4.5" />
            )}
          </button>

          <div className="relative flex-1 group py-2">
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume * 100}
              onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Custom Volume Track */}
            <div className="w-full h-1 bg-[#2c2c2c] rounded-full overflow-hidden">
              <div
                className="h-full bg-zinc-300 group-hover:bg-[#1db954] transition-colors rounded-full"
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
            {/* Volume Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow transition-opacity pointer-events-none"
              style={{ left: `calc(${isMuted ? 0 : volume * 100}% - 4px)` }}
            />
          </div>
        </div>

        <button
          onClick={() => {
            // Toggle element to full screen or visual action
            const el = document.getElementById("root");
            if (el) {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                el.requestFullscreen().catch((err) => console.log(err));
              }
            }
          }}
          className="hover:text-white transition cursor-pointer p-1"
          title="Tela Cheia"
        >
          <Maximize2 className="w-4.5 h-4.5" />
        </button>
      </div>
    </footer>
  );
}
