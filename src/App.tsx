import React, { useState, useEffect, useRef, useCallback } from "react";
import { INITIAL_PLAYLISTS, INITIAL_TRACKS } from "./data";
import { Playlist, Track } from "./types";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import PlayerBar from "./components/PlayerBar";
import RightSidebar from "./components/RightSidebar";
import LoginScreen from "./components/LoginScreen";
import ProfilePage from "./components/ProfilePage";
import { audioEngine } from "./audioEngine";
import { Music2, Home, Search, Grid3X3, User } from "lucide-react";
import AddTrackModal from "./components/AddTrackModal";
import BackgroundBoxes from "./components/BackgroundBoxes";
import { saveAudioFile, getAudioFile, deleteAudioFile, downloadAndCacheAudio } from "./audioStorage";
import { ADMIN_EMAIL } from "./admin";
import {
  fetchTracks,
  fetchPlaylists,
  createTrack,
  updateTrack,
  deleteTrack,
  createPlaylist,
  updatePlaylist,
  uploadAudio,
  clearAllAudioUrls,
} from "./api";
import { supabase } from "./supabase";

export default function App() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(() => {
    const saved = localStorage.getItem("spotify_clone_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    const saved = localStorage.getItem("spotify_clone_playlists");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_PLAYLISTS;
  });
  const [allTracks, setAllTracks] = useState<Track[]>(() => {
    const saved = localStorage.getItem("spotify_clone_tracks");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* ignore */ }
    }
    return [];
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dbStatus, setDbStatus] = useState<string>("connecting");
  const [syncTrigger, setSyncTrigger] = useState(0);

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
  const [activeTab, setActiveTab] = useState<"home" | "search" | "playlist" | "lyrics" | "gallery" | "profile">("home");
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [activeRightSidebar, setActiveRightSidebar] = useState(true);
  const [showAddTrackModal, setShowAddTrackModal] = useState(false);
  const [playlistContextId, setPlaylistContextId] = useState<string | null>(null);
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const allTracksRef = useRef(allTracks);
  allTracksRef.current = allTracks;
  const handleNextTrackRef = useRef<(() => void) | null>(null);

  const handleLogin = (name: string, email: string) => {
    const userData = { name, email };
    setUser(userData);
    localStorage.setItem("spotify_clone_user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    audioEngine.pause();
    setUser(null);
    localStorage.removeItem("spotify_clone_user");
  };

  // Load data from server on mount and when user changes
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        console.log("[SpotifyClone] Carregando dados... Supabase:", !!supabase ? "configurado" : "NÃO configurado");
        const [tracks, playlistsData] = await Promise.all([
          fetchTracks().catch((e) => { console.error("fetchTracks:", e); return null; }),
          fetchPlaylists().catch((e) => { console.error("fetchPlaylists:", e); return null; }),
        ]);

        if (cancelled) return;

        const trackCount = tracks?.length ?? 0;
        console.log("[SpotifyClone] Faixas recebidas:", trackCount, "| Playlists:", playlistsData?.length ?? 0);
        setDbStatus(supabase
          ? (trackCount > 0 ? `ok (${trackCount} faixas)` : "vazio - tabela faixas sem dados")
          : "sem_supabase"
        );

        let cleanTracks = tracks ?? [];

        if (tracks && tracks.length > 0) {
          // Remove broken audio_url: files no longer exist in Supabase Storage
          const tracksWithAudio = tracks.filter((t) => t.audioUrl);
          if (tracksWithAudio.length > 0) {
            clearAllAudioUrls().catch(() => {});
          }
          cleanTracks = tracks.map((t) => (t.audioUrl ? { ...t, audioUrl: undefined } : t));

          setAllTracks((prev) => {
            const serverIds = new Set(cleanTracks.map((t) => t.id));
            const localOnly = prev.filter((t) => !serverIds.has(t.id));
            return [...cleanTracks, ...localOnly];
          });
        }

        if (playlistsData && playlistsData.length > 0) setPlaylists(playlistsData);

        setDataLoaded(true);

        // After dataLoaded, sync local-only tracks to server
        setTimeout(() => {
          if (cancelled) return;
          const current = allTracksRef.current;
          const serverIds = new Set((tracks ?? []).map((t) => t.id));
          const localOnly = current.filter((t) => !serverIds.has(t.id));
          for (const track of localOnly) {
            createTrack(track, user?.email).catch((e) =>
              console.error("Erro ao sincronizar faixa local:", track.id, e)
            );
          }

          // Also push playlists that don't exist on server
          if (playlistsData) {
            const serverPlaylistIds = new Set(playlistsData.map((p) => p.id));
            const localOnlyPlaylists = playlists.filter((p) => !serverPlaylistIds.has(p.id));
            for (const pl of localOnlyPlaylists) {
              createPlaylist(pl).catch((e) =>
                console.error("Erro ao sincronizar playlist local:", pl.id, e)
              );
            }
          }

          // Background: download and cache audio from audioUrl for all tracks
          for (const track of cleanTracks) {
            if (track.audioUrl) {
              getAudioFile(track.id).then((cached) => {
                if (!cached && !cancelled) {
                  downloadAndCacheAudio(track.id, track.audioUrl!).catch(() => {});
                }
              });
            }
          }
        }, 0);
      } catch (err) {
        console.error("Erro ao carregar dados do servidor:", err);
        setDataLoaded(true);
      }
    };
    loadData();
    return () => { cancelled = true; };
  }, [user?.email]);

  // Polling: sync every 5 seconds - server is source of truth
  useEffect(() => {
    if (!dataLoaded) return;
    const syncFromServer = async () => {
      try {
        const [tracks, playlistsData] = await Promise.all([
          fetchTracks().catch(() => null),
          fetchPlaylists().catch(() => null),
        ]);
        if (tracks) {
          setAllTracks((prev) => {
            const serverIds = new Set(tracks.map((t) => t.id));
            const localOnly = prev.filter((t) => !serverIds.has(t.id));
            return [...tracks, ...localOnly];
          });
          // Push local-only tracks to Supabase
          const localTracks = allTracksRef.current;
          const serverIds = new Set(tracks.map((t) => t.id));
          const localOnly = localTracks.filter((t) => !serverIds.has(t.id));
          if (localOnly.length > 0) {
            console.log(`[SpotifyClone] Sincronizando ${localOnly.length} faixas locais para Supabase...`);
          }
          for (const track of localOnly) {
            createTrack(track, user?.email).catch((e) =>
              console.error("[SpotifyClone] Erro ao sincronizar faixa:", track.id, e?.message)
            );
          }
        }
        if (playlistsData) {
          setPlaylists((prevPlaylists) => {
            const merged = [...playlistsData];
            for (const local of prevPlaylists) {
              if (!merged.find((p) => p.id === local.id)) {
                merged.push(local);
                createPlaylist(local).catch(() => {});
              }
            }
            return merged;
          });
        }
      } catch {
        // silent fail
      }
    };
    syncFromServer();
    const interval = setInterval(syncFromServer, 5000);
    return () => clearInterval(interval);
  }, [dataLoaded, syncTrigger]);

  useEffect(() => {
    try {
      const tracksToSave = allTracks.map(({ audioFile, ...rest }) => rest);
      localStorage.setItem("spotify_clone_tracks", JSON.stringify(tracksToSave));
    } catch (err) {
      console.error("Erro ao salvar faixas no localStorage:", err);
    }
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
        const { audioFile, ...trackWithoutAudio } = currentTrack;
        localStorage.setItem("spotify_clone_current_track", JSON.stringify(trackWithoutAudio));
      } catch (err) {
        console.error("Erro ao salvar faixa atual no localStorage:", err);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    localStorage.setItem("spotify_clone_volume", String(volume));
    audioEngine.setVolume(volume, isMuted);
  }, [volume, isMuted]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && currentTrack) {
      interval = setInterval(() => {
        const mediaEl = audioEngine.getMediaElement();
        if (audioEngine.isUsingUploadedFile() && mediaEl) {
          const currentTime = Math.floor(mediaEl.currentTime);
          setProgress(currentTime);
          if (mediaEl.ended) {
            handleNextTrackRef.current();
          }
        } else {
          setProgress((prev) => {
            if (prev >= currentTrack.duration) {
              handleNextTrackRef.current();
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
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        for (let i = 0; i < width; i++) {
          const y = height / 2 + Math.sin(i * 0.08) * 3;
          ctx.lineTo(i, y);
        }
        ctx.stroke();
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const barWidth = (width / bufferLength) * 2.2;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        const hue = (i / bufferLength) * 120 + 110;
        ctx.fillStyle = `hsla(${hue}, 85%, 55%, 0.85)`;
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

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (!dataLoaded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#1db954] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-zinc-400">Carregando músicas...</p>
        </div>
      </div>
    );
  }

  const handlePlayPause = async () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      let audioData = await getAudioFile(currentTrack.id);
      if (!audioData && currentTrack.audioUrl) {
        audioData = await downloadAndCacheAudio(currentTrack.id, currentTrack.audioUrl);
      }
      const audio = audioData || currentTrack.audioFile || currentTrack.audioUrl;
      const trackToPlay = audio ? { ...currentTrack, audioFile: audio } : currentTrack;
      audioEngine.play(trackToPlay);
      setIsPlaying(true);
    }
  };

  const handlePlayTrack = async (track: Track, fromPlaylistId?: string) => {
    audioEngine.pause();
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);

    let audioData = await getAudioFile(track.id);
    if (!audioData && track.audioUrl) {
      audioData = await downloadAndCacheAudio(track.id, track.audioUrl);
    }
    const audio = audioData || track.audioFile || track.audioUrl;
    const trackToPlay = audio ? { ...track, audioFile: audio } : track;
    audioEngine.play(trackToPlay);

    if (fromPlaylistId) {
      setPlaylistContextId(fromPlaylistId);
    } else {
      setPlaylistContextId(null);
    }
  };

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

  const handleNextTrack = async () => {
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

    let nextTrackId = "";
    if (repeat) {
      setProgress(0);
      let audioData = await getAudioFile(currentTrack.id);
      if (!audioData && currentTrack.audioUrl) {
        audioData = await downloadAndCacheAudio(currentTrack.id, currentTrack.audioUrl);
      }
      const audio = audioData || currentTrack.audioFile || currentTrack.audioUrl;
      const trackToPlay = audio ? { ...currentTrack, audioFile: audio } : currentTrack;
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

  handleNextTrackRef.current = handleNextTrack;

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
  };

  const handleCreatePlaylist = async (name: string, description?: string) => {
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
    try {
      await createPlaylist(newPlaylist);
    } catch (err) {
      console.error("Erro ao salvar playlist no servidor:", err);
    }
  };

  const handleAddTrackToPlaylist = async (playlistId: string, trackId: string) => {
    let updatedPlaylist: Playlist | null = null;
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          if (!p.tracks.includes(trackId)) {
            updatedPlaylist = { ...p, tracks: [...p.tracks, trackId] };
            return updatedPlaylist;
          }
        }
        return p;
      })
    );
    if (updatedPlaylist) {
      try {
        await updatePlaylist(playlistId, updatedPlaylist);
        setSyncTrigger((t) => t + 1);
      } catch (err) {
        console.error("Erro ao atualizar playlist no servidor:", err);
      }
    }
  };

  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    let updatedPlaylist: Playlist | null = null;
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          updatedPlaylist = { ...p, tracks: p.tracks.filter((id) => id !== trackId) };
          return updatedPlaylist;
        }
        return p;
      })
    );
    if (updatedPlaylist) {
      try {
        await updatePlaylist(playlistId, updatedPlaylist);
        setSyncTrigger((t) => t + 1);
      } catch (err) {
        console.error("Erro ao atualizar playlist no servidor:", err);
      }
    }
  };

  const handleToggleLiked = async (trackId: string) => {
    let updatedTrack: Track | null = null;
    setAllTracks((prevTracks) =>
      prevTracks.map((t) => {
        if (t.id === trackId) {
          const updatedLiked = !t.liked;
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
          updatedTrack = { ...t, liked: updatedLiked };
          return updatedTrack;
        }
        return t;
      })
    );

    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, liked: !prev.liked } : null));
    }

    if (updatedTrack) {
      try {
        await updateTrack(trackId, { liked: updatedTrack.liked });
        setSyncTrigger((t) => t + 1);
      } catch (err) {
        console.error("Erro ao atualizar like no servidor:", err);
      }
    }
  };

  const handleAddTrack = async (trackData: Omit<Track, "id">, audioFile?: File) => {
    const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTrack: Track = { ...trackData, id: newId };

    if (audioFile) {
      // Save to local IndexedDB as fallback
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(audioFile);
      });
      try {
        await saveAudioFile(newId, base64);
      } catch (err) {
        console.error("Erro ao salvar áudio local:", err);
      }
      // Upload to Supabase Storage for all users
      try {
        const audioUrl = await uploadAudio(newId, audioFile);
        if (audioUrl) newTrack.audioUrl = audioUrl;
      } catch (err) {
        console.error("Erro ao enviar áudio para Supabase Storage:", err);
      }
    }

    try {
      await createTrack(newTrack, user?.email);
      setAllTracks((prev) => [...prev, newTrack]);
      setActiveTab("search");
      setSyncTrigger((t) => t + 1);
    } catch (err) {
      console.error("Erro ao enviar faixa para o servidor:", err);
      setAllTracks((prev) => [...prev, newTrack]);
      setActiveTab("search");
    }
  };

  const handleAddBatch = async (batch: Array<{ track: Omit<Track, "id">; audioFile?: File }>) => {
    const newTracks: Track[] = [];

    for (const item of batch) {
      const newId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newTrack: Track = { ...item.track, id: newId };

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
          console.error("Erro ao salvar áudio local:", err);
        }
        // Upload to Supabase Storage
        try {
          const audioUrl = await uploadAudio(newId, item.audioFile);
          if (audioUrl) newTrack.audioUrl = audioUrl;
        } catch (err) {
          console.error("Erro ao enviar áudio para Supabase Storage:", err);
        }
      }

      try {
        await createTrack(newTrack, user?.email);
        newTracks.push(newTrack);
      } catch (err) {
        console.error("Erro ao enviar faixa para o servidor:", err);
        newTracks.push(newTrack);
      }
    }

    setAllTracks((prev) => [...prev, ...newTracks]);
    setActiveTab("search");
  };

  const handleRemoveTrack = async (trackId: string) => {
    setAllTracks((prev) => prev.filter((t) => t.id !== trackId));
    await deleteAudioFile(trackId).catch(() => {});
    if (currentTrack?.id === trackId) {
      audioEngine.pause();
      setCurrentTrack(null);
      setIsPlaying(false);
      setProgress(0);
    }
    try {
      await deleteTrack(trackId);
      setSyncTrigger((t) => t + 1);
    } catch (err) {
      console.error("Erro ao deletar faixa no servidor:", err);
    }
  };

  const likedCount = allTracks.filter((t) => t.liked).length;
  const isCurrentTrackLiked = currentTrack ? allTracks.find((t) => t.id === currentTrack.id)?.liked || false : false;
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div
      className="h-full w-full flex flex-col bg-black text-white overflow-hidden font-sans select-none"
      id="app-container"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
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

      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
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
          userName={user.name}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          onSwitchUser={handleLogin}
        />

        <div className="flex-1 flex flex-col min-w-0 bg-[#121212] rounded-lg overflow-hidden relative">
          
          {dbStatus !== "ok" && dbStatus !== "connecting" && (
            <div className={`px-3 py-1.5 text-[10px] font-mono z-40 ${dbStatus.includes("vazio") || dbStatus === "sem_supabase" ? "bg-yellow-500/20 text-yellow-400 border-b border-yellow-500/30" : "bg-green-500/20 text-green-400 border-b border-green-500/30"}`}>
              DB: {dbStatus} | Faixas locais: {allTracks.length}
            </div>
          )}

          <div className="absolute top-2 right-4 w-40 h-10 pointer-events-none z-30 opacity-70 flex items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">SINTETIZADOR</span>
            <canvas ref={canvasRef} width={120} height={32} className="w-30 h-8 rounded" />
          </div>

          <MainContent
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              if (tab === "home" || tab === "search" || tab === "gallery" || tab === "profile") {
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
            isAdmin={isAdmin}
            userName={user.name}
          />

          {activeTab === "profile" && (
            <ProfilePage
              userName={user.name}
              userEmail={user.email}
              allTracks={allTracks}
              playlists={playlists}
              onLogout={handleLogout}
            />
          )}
        </div>

        {activeRightSidebar && (
          <RightSidebar
            currentTrack={currentTrack}
            onPlayTrack={handlePlayTrack}
            allTracks={allTracks}
          />
        )}
      </div>

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
        onSeek={(time) => audioEngine.seek(time)}
      />

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
          <span className="text-[10px] font-semibold">Inicio</span>
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
        {isAdmin && (
          <button
            onClick={() => setShowAddTrackModal(true)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer text-zinc-500"
          >
            <Music2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Adicionar</span>
          </button>
        )}
        <button
          onClick={() => {
            setActiveTab("profile");
            setCurrentPlaylistId(null);
          }}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition cursor-pointer ${
            activeTab === "profile" ? "text-white" : "text-zinc-500"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Perfil</span>
        </button>
      </nav>

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
