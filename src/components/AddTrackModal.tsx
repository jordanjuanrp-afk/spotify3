import React, { useState, useRef } from "react";
import { X, Music, Upload, FileAudio, Check, Trash2, Loader2 } from "lucide-react";
import { Track } from "../types";

interface AddTrackModalProps {
  onAdd: (track: Omit<Track, "id">, audioFile?: File) => void;
  onAddBatch?: (tracks: Array<{ track: Omit<Track, "id">; audioFile?: File }>) => void;
  onClose: () => void;
}

const GENRES: Track["synthGenre"][] = ["techno", "sertanejo", "electronic", "trap", "pop", "funk", "remix", "slowed"];

const GENRE_LABELS: Record<Track["synthGenre"], string> = {
  techno: "Techno",
  sertanejo: "Sertanejo",
  electronic: "Eletrônico",
  trap: "Trap",
  pop: "Pop",
  funk: "Funk",
  remix: "Remix",
  slowed: "Slowed",
};

const DEFAULT_COVERS: Record<Track["synthGenre"], string> = {
  techno: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
  sertanejo: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&auto=format&fit=crop&q=60",
  electronic: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=60",
  trap: "https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?w=300&auto=format&fit=crop&q=60",
  pop: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=60",
  funk: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=60",
  remix: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&auto=format&fit=crop&q=60",
  slowed: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=60",
};

interface PendingFile {
  file: File;
  title: string;
  duration: number;
}

export default function AddTrackModal({ onAdd, onAddBatch, onClose }: AddTrackModalProps) {
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState<Track["synthGenre"]>("pop");
  const [cover, setCover] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter((f) => f.type.startsWith("audio/"));
    const newPending: PendingFile[] = [];

    audioFiles.forEach((file) => {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      const pending: PendingFile = { file, title: nameWithoutExt, duration: 0 };
      newPending.push(pending);

      audio.src = objectUrl;
      audio.addEventListener("loadedmetadata", () => {
        pending.duration = Math.round(audio.duration);
        setPendingFiles((prev) => [...prev]);
        URL.revokeObjectURL(objectUrl);
      });
    });

    setPendingFiles((prev) => [...prev, ...newPending]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateTitle = (index: number, title: string) => {
    setPendingFiles((prev) => prev.map((f, i) => (i === index ? { ...f, title } : f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFiles.length === 0 || !artist.trim()) return;

    setIsUploading(true);

    if (pendingFiles.length === 1) {
      const pf = pendingFiles[0];
      onAdd(
        {
          title: pf.title.trim() || pf.file.name,
          artist: artist.trim(),
          album: album.trim() || "Sem álbum",
          cover: cover.trim() || DEFAULT_COVERS[genre],
          duration: pf.duration || 180,
          synthGenre: genre,
          liked: false,
        },
        pf.file
      );
    } else if (onAddBatch) {
      const batch = pendingFiles.map((pf) => ({
        track: {
          title: pf.title.trim() || pf.file.name,
          artist: artist.trim(),
          album: album.trim() || "Sem álbum",
          cover: cover.trim() || DEFAULT_COVERS[genre],
          duration: pf.duration || 180,
          synthGenre: genre,
          liked: false,
        },
        audioFile: pf.file,
      }));
      onAddBatch(batch);
    }

    setIsUploading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#181818] rounded-xl border border-[#2a2a2a] w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1db954] rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                {pendingFiles.length > 1 ? `${pendingFiles.length} Músicas` : "Adicionar Música"}
              </h3>
              <p className="text-xs text-zinc-400">Selecione até 50 arquivos de áudio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition cursor-pointer p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Audio File Upload - Multi */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">
              Arquivos de Áudio ({pendingFiles.length}/50)
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-[#1db954] bg-[#1db954]/10"
                  : "border-[#3e3e3e] hover:border-[#1db954]/50 bg-[#2a2a2a]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center">
                  <Upload className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm text-white font-medium">
                    Arraste vários arquivos de áudio aqui
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    ou clique para selecionar (MP3, WAV, OGG, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pending files list */}
          {pendingFiles.length > 0 && (
            <div className="bg-[#2a2a2a] rounded-lg p-2 max-h-48 overflow-y-auto flex flex-col gap-1">
              {pendingFiles.map((pf, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-[#181818] group">
                  <FileAudio className="w-4 h-4 text-[#1db954] shrink-0" />
                  <input
                    type="text"
                    value={pf.title}
                    onChange={(e) => handleUpdateTitle(i, e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
                  />
                  <span className="text-[10px] text-zinc-500 shrink-0">
                    {pf.duration > 0 ? `${Math.floor(pf.duration / 60)}:${(pf.duration % 60).toString().padStart(2, "0")}` : "..."}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(i)}
                    className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-0.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Common fields */}
          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Artista *</label>
            <input
              type="text"
              required
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Nome do artista (aplicado a todas)"
              className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Álbum</label>
            <input
              type="text"
              value={album}
              onChange={(e) => setAlbum(e.target.value)}
              placeholder="Nome do álbum (opcional)"
              className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Gênero</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value as Track["synthGenre"])}
                className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954] cursor-pointer"
              >
                {GENRES.map((g) => (
                  <option key={g} value={g}>{GENRE_LABELS[g]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">URL da Capa</label>
              <input
                type="url"
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="Capa padrão"
                className="w-full bg-[#2a2a2a] border border-[#3e3e3e] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#1db954]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold hover:text-white text-gray-400 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pendingFiles.length === 0 || !artist.trim() || isUploading}
              className="bg-[#1db954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed text-black px-5 py-2 rounded-full font-bold text-sm cursor-pointer transition flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adicionando...
                </>
              ) : pendingFiles.length > 1 ? (
                `Adicionar ${pendingFiles.length} Músicas`
              ) : (
                "Adicionar Música"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
