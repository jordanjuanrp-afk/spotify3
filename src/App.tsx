import React, { useState, useEffect, useRef, useCallback } from "react";
import { INITIAL_PLAYLISTS, INITIAL_TRACKS } from "./data";
import { Playlist, Track } from "./types";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import PlayerBar from "./components/PlayerBar";
import RightSidebar from "./components/RightSidebar";
import { audioEngine } from "./audioEngine";
import { Music2, Home, Search, Grid3X3 } from "lucide-react";
import AddTrackModal from "./components/AddTrackModal";
import BackgroundBoxes from "./components/BackgroundBoxes";
import { saveAudioFile, getAudioFile, deleteAudioFile } from "./audioStorage";

export default function App() {
  // Load initial data from localStorage if existing
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("spotify_clone_playlists");
    return saved ? JSON.parse(saved) : INITIAL_PLAYLISTS;
  });

  const [allTracks, setAllTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_clone_tracks");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentTrack, setCurrentTrack] = useState<Track | null>(() => {
    const saved = localStorage.getItem("spotify_clone_current_track");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem("spotify_clone_volume");
    return saved ? Number(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "search" | "playlist" | "lyrics" | "gallery">("home");
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [activeRightSidebar, setActiveRightSidebar] = useState(true);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);

  // Keep track of the active queue context
  const [playlistContextId, setPlaylistContextId] = useState<string | null>(null);

  // Mouse position for prism grid effect
  const [mouseRotate, setMouseRotate] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = ((e.clientX / window.innerWidth) - 0.5) * 30;
    const y = ((e.clientY / window.innerHeight) - 0.5) * 30;
    setMouseRotate({ x, y });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const x = ((touch.clientX / window.innerWidth) - 0.5) * 30;
    const y = ((touch.clientY / window.innerHeight) - 0.5) * 30;
    setMouseRotate({ x, y });
  }, []);

  // References for visualizer
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper to persist tracks to localStorage
  const persistTracks = (tracks: Track[]) => {
    try {
      const tracksToSave = tracks.map(({ audioFile, ...rest }) => rest);
      localStorage.setItem("spotify_clone_tracks", JSON.stringify(tracksToSave));
    } catch (err) {
      console.error("Erro ao salvar tracks no localStorage:", err);
    }
  };

  // Save states to local storage on change
  useEffect(() => {
    persistTracks(allTracks);
  }, [allTracks]);

  useEffect(() => {
    try {
      localStorage.setItem("spotify_clone_playlists", JSON.stringify(playlists));
    } catch (err) {
      console.error("Erro ao salvar playlists no localStorage:", err);
    }
  }, [playlists]);

  useEffect(() => {
    if (currentTrack) {
      try {
        localStorage.setItem("spotify_clone_current_track", JSON.stringify(currentTrack));
      } catch (err) {
        console.error("Erro ao salvar currentTrack no localStorage:", err);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem("spotify_clone_volume", String(volume));
    audioEngine.setVolume(volume, isMuted);
  }, [volume, isMuted]);

  // Synchronized playback ticker
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        // Use media element time for uploaded files
        const mediaEl = audioEngine.getMediaElement();
        if (audioEngine.isUsingUploadedFile() && mediaEl) {
          const currentTime = Math.floor(mediaEl.currentTime);
          setProgress(currentTime);
          if (mediaEl.ended) {
            handleNextTrack();
          }
        } else {
          setProgress((prev) => {
            if (prev >= currentTrack.duration) {
              handleNextTrack();
              return 0;
            }
            return prev + 1;
          });
        }
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentTrack, shuffle, repeat, playlistContextId]);

  // Handle Play/Pause actions
  const handlePlayPause = async () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      // Reload audio from IndexedDB if needed
      const audioData = await getAudioFile(currentTrack.id);
      const trackToPlay = audioData ? { ...currentTrack, audioFile: audioData } : currentTrack;
      audioEngine.play(trackToPlay);
      setIsPlaying(true);
    }
  };

  // Play a specific track
  const handlePlayTrack = async (track: Track, fromPlaylistId?: string) => {
    audioEngine.pause();
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);

    // Check if track has uploaded audio in IndexedDB
    const audioData = await getAudioFile(track.id);
    const trackToPlay = audioData ? { ...track, audioFile: audioData } : track;
    audioEngine.play(trackToPlay);

    if (fromPlaylistId) {
      setPlaylistContextId(fromPlaylistId);
    } else {
      setPlaylistContextId(null);
    }
  };

  // Play an entire playlist from the beginning
  const handlePlayPlaylist = (playlist: Playlist) => {
    let tracksList = playlist.tracks;
    if (playlist.id === "liked-songs") {
      tracksList = allTracks.filter((t) => t.liked).map((t) => t.id);
    }

    if (tracksList.length === 0) return;

    const firstTrackId = tracksList[0];
    const firstTrack = allTracks.find((t) => t.id === firstTrackId);
    if (firstTrack) {
      handlePlayTrack(firstTrack, playlist.id);
    }
  };

  // Go to next track in queue/playlist
  const handleNextTrack = async () => {
    if (!currentTrack) return;

    // Get current tracklist context
    let activeTrackIds: string[] = [];
    if (playlistContextId) {
      if (playlistContextId === "liked-songs") {
        activeTrackIds = allTracks.filter((t) => t.liked).map((t) => t.id);
      } else {
        const pl = playlists.find((p) => p.id === playlistContextId);
        if (pl) activeTrackIds = pl.tracks;
      }
    } else {
      // Default fallback to all tracks
      activeTrackIds = allTracks.map((t) => t.id);
    }

    if (activeTrackIds.length === 0) return;

    let nextTrackId = "";
    if (repeat) {
      setProgress(0);
      const audioData = await getAudioFile(currentTrack.id);
      const trackToPlay = audioData ? { ...currentTrack, audioFile: audioData } : currentTrack;
      audioEngine.play(trackToPlay);
      return;
    } else if (shuffle) {
      const randomIndex = Math.floor(Math.random() * activeTrackIds.length);
      nextTrackId = activeTrackIds[randomIndex];
    } else {
      const currentIndex = activeTrackIds.indexOf(currentTrack.id);
      const nextIndex = (currentIndex + 1) % activeTrackIds.length;
      nextTrackId = activeTrackIds[nextIndex];
    }

    const nextTrack = allTracks.find((t) => t.id === nextTrackId);
    if (nextTrack) {
      handlePlayTrack(nextTrack, playlistContextId || undefined);
    }
  };

  // Go to previous track
  const handlePreviousTrack = () => {
    if (!currentTrack) return;

    let activeTrackIds: string[] = [];
    if (playlistContextId) {
      if (playlistContextId === "liked-songs") {
        activeTrackIds = allTracks.filter((t) => t.liked).map((t) => t.id);
      } else {
        const pl = playlists.find((p) => p.id === playlistContextId);
        if (pl) activeTrackIds = pl.tracks;
      }
    } else {
      activeTrackIds = allTracks.map((t) => t.id);
    }

    if (activeTrackIds.length === 0) return;

    let prevTrackId = "";
    const currentIndex = activeTrackIds.indexOf(currentTrack.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      prevIndex = activeTrackIds.length - 1;
    }
    prevTrackId = activeTrackIds[prevIndex];

    const prevTrack = allTracks.find((t) => t.id === prevTrackId);
    if (prevTrack) {
      handlePlayTrack(prevTrack, playlistContextId || undefined);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    // If playing, we can notify engine if timeline seeks are needed
    // Our custom procedural sequencer schedules relative notes based on clock, so we just reset target
  };

  // Create custom playlist
  const handleCreatePlaylist = (name: string, description?: string) => {
    const newPlaylist: Playlist = {
      id: `custom-${Date.now()}`,
      name,
      description,
      cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=60",
      tracks: [],
      isCustom: true,
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    setCurrentPlaylistId(newPlaylist.id);
    setActiveTab("playlist");
  };

  // Add/remove track to custom playlist
  const handleAddTrackToPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (!p.tracks.includes(trackId)) {
            return { ...p, tracks: [...p.tracks, trackId] };
          }
        }
        return p;
      })
    );
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return { ...p, tracks: p.tracks.filter((id) => id !== trackId) };
        }
        return p;
      })
    );
  };

  // Toggle Liked status
  const handleToggleLiked = (trackId: string) => {
    setAllTracks((prevTracks) =>
      prevTracks.map((t) => {
        if (t.id === trackId) {
          const updatedLiked = !t.liked;
          // Synchronize virtual "liked-songs" playlist
          setPlaylists((prevPlaylists) =>
            prevPlaylists.map((p) => {
              if (p.id === "liked-songs") {
                const tracksSet = new Set(p.tracks);
                if (updatedLiked) {
                  tracksSet.add(trackId);
                } else {
                  tracksSet.delete(trackId);
                }
                return { ...p, tracks: Array.from(tracksSet) };
              }
              return p;
            })
          );
          return { ...t, liked: updatedLiked };
        }
        return t;
      })
    );

    // Update currentTrack instance liked state if it's the one modified
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, liked: !prev.liked } : null));
    }
  };

  // Add a new custom track
  const handleAddTrack = (trackData: Omit<Track, "id">, audioFile?: File) => {
    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTrack: Track = { ...trackData, id: newId };

    const finalize = (tracks: Track[]) => {
      setAllTracks(tracks);
      persistTracks(tracks);
      setActiveTab("search");
    };

    if (audioFile) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await saveAudioFile(newId, reader.result as string);
        } catch (err) {
          console.error("Erro ao salvar áudio:", err);
        }
        setAllTracks((prev) => {
          const updated = [...prev, newTrack];
          persistTracks(updated);
          return updated;
        });
        setActiveTab("search");
      };
      reader.onerror = () => {
        console.error("Erro ao ler arquivo");
        setAllTracks((prev) => {
          const updated = [...prev, newTrack];
          persistTracks(updated);
          return updated;
        });
        setActiveTab("search");
      };
      reader.readAsDataURL(audioFile);
    } else {
      setAllTracks((prev) => {
        const updated = [...prev, newTrack];
        persistTracks(updated);
        return updated;
      });
      setActiveTab("search");
    }
  };

  // Add multiple tracks at once (batch upload)
  const handleAddBatch = async (batch: Array<{ track: Omit<Track, "id">; audioFile?: File }>) => {
    const newTracks: Track[] = [];

    for (const item of batch) {
      const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newTrack: Track = { ...item.track, id: newId };
      newTracks.push(newTrack);

      if (item.audioFile) {
        try {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(item.audioFile!);
          });
          await saveAudioFile(newId, base64);
        } catch (err) {
          console.error("Erro ao salvar áudio:", err);
        }
      }
    }

    setAllTracks((prev) => {
      const updated = [...prev, ...newTracks];
      persistTracks(updated);
      return updated;
    });
    setActiveTab("search");
  };

  // Remove a track from library
  const handleRemoveTrack = async (trackId: string) => {
    setAllTracks((prev) => {
      const updated = prev.filter((t) => t.id !== trackId);
      persistTracks(updated);
      return updated;
    });
    await deleteAudioFile(trackId).catch(() => {});
    if (currentTrack?.id === trackId) {
      audioEngine.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
      setProgress(0);
    }
  };

  // Real-time Canvas sound visualizer logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (!analyser || !isPlaying) {
        // Draw static wave line when paused
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.08) * 3;
          ctx.lineTo(i, y);
        }
        ctx.stroke();
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Render a gorgeous audio frequency bar spectrum
      const barWidth = (width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Custom gradient color based on frequency
        const hue = (i / bufferLength) * 120 + 110; // green to blue hues
        ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.85)`;

        // Draw rounded bars
        const yPos = height - barHeight;
        ctx.fillRect(x, yPos, barWidth - 1.5, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const likedCount = allTracks.filter((t) => t.liked).length;
  const isCurrentTrackLiked = currentTrack ? allTracks.find((t) => t.id === currentTrack.id)?.liked || false : false;

  return (
    <div
      className="h-full w-full flex flex-col bg-black text-white overflow-hidden font-sans select-none"
      id="app-container"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Prism Grid Background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <BackgroundBoxes
          backgroundColor="transparent"
          boxSize={35}
          borderWidth={1}
          borderColor="rgba(255,255,255,0.08)"
          rotate={mouseRotate}
          colors={{
            paletteCount: 6,
            color1: "#1db954",
            color2: "#1ed760",
            color3: "#ffffff",
            color4: "#535353",
            color5: "#b3b3b3",
            color6: "#121212",
          }}
        />
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
      {/* Top Section: Sidebars & Main content */}
      <div className="flex-1 flex overflow-hidden min-h-0 p-1 sm:p-2 gap-1 sm:gap-2">
        <Sidebar
          playlists={playlists}
          currentPlaylistId={currentPlaylistId}
          onSelectPlaylist={(id) => {
            setCurrentPlaylistId(id);
            if (id) {
              setActiveTab("playlist");
            } else {
              setActiveTab("home");
            }
          }}
          onCreatePlaylist={handleCreatePlaylist}
          onOpenAddTrack={() => setShowAddTrackModal(true)}
          likedCount={likedCount}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab === "home" || tab === "search" || tab === "gallery") {
              setCurrentPlaylistId(null);
            }
          }}
          isPlayingTrackId={currentTrack?.id}
          isAudioPlaying={isPlaying}
        />

        {/* Center Main panel + small visualizer overlay */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#121212] rounded-lg overflow-hidden relative">
          
          {/* Animated Wave visualizer bar integrated in the top background */}
          <div className="absolute top-2 right-4 w-40 h-10 pointer-events-none z-30 opacity-70 flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">SINTETIZADOR</span>
            <canvas ref={canvasRef} width={120} height={32} className="w-30 h-8 rounded" />
          </div>

          <MainContent
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === "home" || tab === "search" || tab === "gallery") {
                setCurrentPlaylistId(null);
              }
            }}
            playlists={playlists}
            currentPlaylistId={currentPlaylistId}
            onSelectPlaylist={(id) => {
              setCurrentPlaylistId(id);
              setActiveTab("playlist");
            }}
            allTracks={allTracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            onPlayTrack={handlePlayTrack}
            onToggleLiked={handleToggleLiked}
            onAddTrackToPlaylist={handleAddTrackToPlaylist}
            onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
            onRemoveTrack={handleRemoveTrack}
            onPlayPlaylist={handlePlayPlaylist}
          />
        </div>

        {/* Right Sidebar */}
        {activeRightSidebar && (
          <RightSidebar
            currentTrack={currentTrack}
            onPlayTrack={handlePlayTrack}
            allTracks={allTracks}
          />
        )}
      </div>

      {/* Bottom Audio Player bar */}
      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onPrevious={handlePreviousTrack}
        progress={progress}
        onProgressChange={handleProgressChange}
        volume={volume}
        onVolumeChange={setVolume}
        isMuted={isMuted}
        onToggleMute={() => setIsMuted((prev) => !prev)}
        shuffle={shuffle}
        onToggleShuffle={() => setShuffle((prev) => !prev)}
        repeat={repeat}
        onToggleRepeat={() => setRepeat((prev) => !prev)}
        onToggleLiked={handleToggleLiked}
        isLiked={isCurrentTrackLiked}
        activeLyrics={activeTab === "lyrics"}
        onToggleLyrics={() => {
          if (activeTab === "lyrics") {
            setActiveTab("home");
          } else {
            setActiveTab("lyrics");
          }
        }}
        activeRightSidebar={activeRightSidebar}
        onToggleRightSidebar={() => setActiveRightSidebar((prev) => !prev)}
      />

      {/* Mobile Bottom Navigation - visible only on small screens */}
      <nav className="md:hidden flex items-center justify-around bg-[#121212] border-t border-zinc-900 px-2 py-1.5 shrink-0">
        <button
          onClick={() => {
            setActiveTab("home");
            setCurrentPlaylistId(null);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer ${
            activeTab === "home" ? "text-white" : "text-zinc-500"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Início</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("search");
            setCurrentPlaylistId(null);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer ${
            activeTab === "search" ? "text-white" : "text-zinc-500"
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Buscar</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("gallery");
            setCurrentPlaylistId(null);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer ${
            activeTab === "gallery" ? "text-white" : "text-zinc-500"
          }`}
        >
          <Grid3X3 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Galeria</span>
        </button>
        <button
          onClick={() => setShowAddTrackModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer text-zinc-500"
        >
          <Music2 className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Adicionar</span>
        </button>
      </nav>

      {/* Add Track Modal */}
      {showAddTrackModal && (
        <AddTrackModal
          onAdd={handleAddTrack}
          onAddBatch={handleAddBatch}
          onClose={() => setShowAddTrackModal(false)}
        />
      )}
      </div>
    </div>
  );
}
