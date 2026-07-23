import { Track } from "./types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isPlaying = false;
  private currentTrack: Track | null = null;
  private schedulerId: number | null = null;

  // Music sequencer state
  private bpm = 120;
  private nextNoteTime = 0.0;
  private current16thNote = 0;
  private lookahead = 25.0; // ms
  private scheduleAheadTime = 0.1; // seconds

  // Active voice nodes for cleanup
  private activeNodes: AudioNode[] = [];

  // HTML Audio element for uploaded files
  private mediaElement: HTMLAudioElement | null = null;
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private usingUploadedFile = false;

  constructor() {
    // Lazy initialized on first user interaction to comply with browser policies
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.init();
    return this.analyser;
  }

  public setVolume(volume: number, isMuted: boolean) {
    this.init();
    if (!this.masterGain || !this.ctx) return;
    const targetVolume = isMuted ? 0 : volume;
    this.masterGain.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.05);
    // Also set volume on media element if playing uploaded file
    if (this.mediaElement) {
      this.mediaElement.volume = isMuted ? 0 : volume;
    }
  }

  public play(track: Track) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    // Stop any previous playback
    this.stopAllActiveVoices();
    if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
    }

    this.isPlaying = true;
    this.currentTrack = track;

    // Check if this track has an uploaded audio file (local or remote)
    if (track.audioFile || track.audioUrl) {
      this.playUploadedFile(track);
      return;
    }

    this.usingUploadedFile = false;

    // Set BPM based on genre
    switch (track.synthGenre) {
      case "techno":
        this.bpm = 142;
        break;
      case "funk":
        this.bpm = 130;
        break;
      case "trap":
        this.bpm = 135;
        break;
      case "sertanejo":
        this.bpm = 108;
        break;
      case "electronic":
        this.bpm = 124;
        break;
      case "remix":
        this.bpm = 128;
        break;
      case "slowed":
        this.bpm = 85;
        break;
      case "pop":
      default:
        this.bpm = 118;
        break;
    }

    this.nextNoteTime = this.ctx.currentTime;
    this.current16thNote = 0;

    if (this.schedulerId === null) {
      this.schedulerId = window.setInterval(() => this.scheduler(), this.lookahead);
    }
  }

  private playUploadedFile(track: Track) {
    if (!this.ctx || !this.masterGain) return;

    this.usingUploadedFile = true;

    // Create or reuse HTMLAudioElement
    if (!this.mediaElement) {
      this.mediaElement = new Audio();
      this.mediaElement.crossOrigin = "anonymous";
    }

    // Use audioUrl (Supabase Storage) if available, fallback to audioFile (base64)
    this.mediaElement.src = track.audioFile || track.audioUrl || "";
    this.mediaElement.volume = this.masterGain.gain.value;

    // Connect to Web Audio API for visualization
    if (!this.mediaSource) {
      this.mediaSource = this.ctx.createMediaElementSource(this.mediaElement);
      this.mediaSource.connect(this.masterGain);
    }

    this.mediaElement.play().catch((err) => {
      console.error("Failed to play uploaded audio:", err);
    });
  }

  public pause() {
    this.isPlaying = false;
    if (this.schedulerId !== null) {
      window.clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    this.stopAllActiveVoices();

    // Pause uploaded file if playing
    if (this.mediaElement && this.usingUploadedFile) {
      this.mediaElement.pause();
    }
  }

  public getMediaElement(): HTMLAudioElement | null {
    return this.mediaElement;
  }

  public isUsingUploadedFile(): boolean {
    return this.usingUploadedFile;
  }

  private stopAllActiveVoices() {
    // Simply let them fade or clear array
    this.activeNodes = [];
  }

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNextNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }
  }

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.bpm;
    this.nextNoteTime += 0.25 * secondsPerBeat; // Add 1/4 of a beat (16th note)
    this.current16thNote = (this.current16thNote + 1) % 16;
  }

  // Synthesize instruments procedurally
  private scheduleNextNote(step: number, time: number) {
    if (!this.ctx || !this.currentTrack) return;

    const genre = this.currentTrack.synthGenre;

    // --- 1. DRUMS SEQUENCER ---
    let triggerKick = false;
    let triggerSnare = false;
    let triggerHat = false;

    if (genre === "techno") {
      // Techno 4/4 heavy kick, constant hats on offbeats
      triggerKick = step % 4 === 0;
      triggerHat = step % 4 === 2 || step % 2 === 1;
      triggerSnare = step % 8 === 4;
    } else if (genre === "funk") {
      // Funk syncopated beat: 1, 0, 0, 1, 1, 0, 1, 0...
      // Classic funk beat: Kick on 0, 8, 11; Snare/Clap on 4, 12, 14
      triggerKick = step === 0 || step === 6 || step === 8 || step === 14;
      triggerSnare = step === 4 || step === 10 || step === 12;
      triggerHat = step % 2 === 0;
    } else if (genre === "trap") {
      // Trap: heavy sub kick, fast hi-hat rolls
      triggerKick = step === 0 || step === 10;
      triggerSnare = step === 8;
      triggerHat = step % 2 === 0 || (step >= 4 && step <= 6) || (step >= 12 && step <= 14); // rolls
    } else if (genre === "sertanejo") {
      // Sertanejo: soft slow pop beat
      triggerKick = step === 0 || step === 8;
      triggerSnare = step === 4 || step === 12;
      triggerHat = step % 4 === 2;
    } else if (genre === "electronic" || genre === "pop") {
      // Classic house beat
      triggerKick = step % 4 === 0;
      triggerSnare = step === 4 || step === 12;
      triggerHat = step % 4 === 2;
    } else if (genre === "remix") {
      // Remix: energetic house with extra percussion
      triggerKick = step % 4 === 0;
      triggerSnare = step === 4 || step === 12;
      triggerHat = step % 2 === 0;
    } else if (genre === "slowed") {
      // Slowed: laid-back R&B feel, sparse beats
      triggerKick = step === 0 || step === 10;
      triggerSnare = step === 6;
      triggerHat = step % 4 === 2;
    }

    if (triggerKick) this.playKick(time, genre);
    if (triggerSnare) this.playSnare(time, genre);
    if (triggerHat) this.playHiHat(time, genre);

    // --- 2. BASS & MELODY SYNTHESIZERS ---
    this.playSynthElements(step, time, genre);
  }

  private playKick(time: number, genre: string) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    // Techno kick is deep and loud, sertanejo is soft
    const isTechno = genre === "techno";
    const isTrap = genre === "trap";
    const duration = isTrap ? 0.6 : isTechno ? 0.3 : 0.2;
    const startFreq = isTrap ? 120 : isTechno ? 180 : 130;
    const endFreq = isTrap ? 35 : isTechno ? 45 : 50;

    osc.frequency.setValueAtTime(startFreq, time);
    osc.frequency.exponentialRampToValueAtTime(endFreq, time + 0.15);

    gain.gain.setValueAtTime(isTechno ? 0.8 : 0.6, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + duration);

    osc.start(time);
    osc.stop(time + duration);
  }

  private playSnare(time: number, genre: string) {
    if (!this.ctx || !this.masterGain) return;

    // Procedural noise-based snare
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(genre === "funk" ? 1200 : 1000, time);

    const gain = this.ctx.createGain();
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    gain.gain.setValueAtTime(genre === "funk" ? 0.4 : 0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    // Add a tonal snap to the snare
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = "triangle";
    snap.frequency.setValueAtTime(180, time);
    snap.connect(snapGain);
    snapGain.connect(this.masterGain);
    
    snapGain.gain.setValueAtTime(0.2, time);
    snapGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    noise.start(time);
    noise.stop(time + 0.15);
    snap.start(time);
    snap.stop(time + 0.05);
  }

  private playHiHat(time: number, genre: string) {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(7000, time);

    const gain = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    const volume = genre === "trap" ? 0.15 : 0.08;
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.04);

    noise.start(time);
    noise.stop(time + 0.05);
  }

  private playSynthElements(step: number, time: number, genre: string) {
    if (!this.ctx || !this.masterGain) return;

    // Simple scale-based progression (A minor)
    // Notes: A(220), C(261.63), D(293.66), E(329.63), G(392.00), A(440)
    const scale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    // Bassline notes sequence based on 16-step grid
    let bassIndex = 0;
    let playBass = false;

    // Lead notes sequence
    let leadIndex = -1;
    let playLead = false;

    if (genre === "techno") {
      // Rolling driving bass
      playBass = step % 4 !== 0; // offbeats bass
      bassIndex = step % 8 < 4 ? 0 : 1; // alternating A and C
      
      // Acid lead accent
      if (step === 3 || step === 7 || step === 11 || step === 14) {
        playLead = true;
        leadIndex = 4 + (step % 3);
      }
    } else if (genre === "trap") {
      // Deep 808 sub bass (A, G, F, E)
      playBass = step === 0 || step === 6 || step === 12;
      const progress808 = Math.floor(time / 4) % 4;
      bassIndex = [0, 4, 3, 2][progress808]; // different root note per bar

      // Plucky synth lead
      if (step % 4 === 1 || step === 14) {
        playLead = true;
        leadIndex = 5 + (step % 4);
      }
    } else if (genre === "sertanejo") {
      // Soft arpeggiated acoustic feeling
      playBass = step === 0 || step === 8;
      bassIndex = step === 0 ? 0 : 3; // root A then E

      // Pluck melody (acoustic-like)
      if (step % 2 === 0) {
        playLead = true;
        // Warm cascading arpeggio
        const arpPattern = [5, 6, 7, 6, 5, 4, 3, 4];
        leadIndex = arpPattern[step / 2];
      }
    } else if (genre === "funk") {
      // Syncopated funk bass
      playBass = step === 2 || step === 6 || step === 10 || step === 13;
      bassIndex = (step % 6 === 0) ? 1 : 0;

      // Brass-like synth stab
      if (step === 4 || step === 12) {
        playLead = true;
        leadIndex = 5;
      }
    } else if (genre === "remix") {
      // Remix: driving bass with layered synth melody
      playBass = step % 2 === 0;
      bassIndex = step % 8 < 4 ? 0 : 2;

      if (step % 4 === 1 || step === 14) {
        playLead = true;
        leadIndex = 4 + (step % 5);
      }
    } else if (genre === "slowed") {
      // Slowed: deep dreamy bass with reverb-like pad
      playBass = step === 0 || step === 6 || step === 12;
      bassIndex = [0, 3, 2][Math.floor(step / 5) % 3];

      if (step % 4 === 0) {
        playLead = true;
        leadIndex = 5 + (step % 3);
      }
    } else {
      // electronic / pop: standard 16-step synth groove
      playBass = step % 2 === 0;
      bassIndex = step % 16 < 8 ? 0 : 3;

      if (step % 4 === 2) {
        playLead = true;
        leadIndex = 4 + (step % 4);
      }
    }

    // Play Bass Node
    if (playBass) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.connect(gain);
      gain.connect(this.masterGain);

      // Bass is a warm triangle or a solid sawtooth
      osc.type = genre === "techno" ? "sawtooth" : "triangle";
      
      // Frequency octaves lower (divided by 2 or 4)
      const freq = scale[bassIndex] / 2;
      osc.frequency.setValueAtTime(freq, time);

      // Filter sweep for techno acid bass
      if (genre === "techno") {
        const filter = this.ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.exponentialRampToValueAtTime(1200, time + 0.05);
        filter.frequency.exponentialRampToValueAtTime(150, time + 0.15);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);
      }

      gain.gain.setValueAtTime(genre === "trap" ? 0.6 : 0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + (genre === "trap" ? 0.5 : 0.18));

      osc.start(time);
      osc.stop(time + (genre === "trap" ? 0.6 : 0.2));
    }

    // Play Lead Melody Node
    if (playLead && leadIndex >= 0 && leadIndex < scale.length) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.masterGain);

      // Lead is triangle (warm pluck) or sine (clear bell)
      osc.type = (genre === "sertanejo" || genre === "trap") ? "sine" : "sawtooth";
      
      // Lead frequency is high
      const freq = scale[leadIndex] * (genre === "trap" ? 2.0 : 1.5);
      osc.frequency.setValueAtTime(freq, time);

      if (genre === "techno") {
        // Highpass filter for thin sizzly acid leads
        const bpf = this.ctx.createBiquadFilter();
        bpf.type = "bandpass";
        bpf.frequency.setValueAtTime(2500, time);
        osc.disconnect(gain);
        osc.connect(bpf);
        bpf.connect(gain);
      }

      // Quick decay pluck volume
      const decay = (genre === "sertanejo") ? 0.25 : 0.12;
      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.002, time + decay);

      osc.start(time);
      osc.stop(time + decay + 0.05);
    }
  }
}

// Singleton instances to be used application-wide
export const audioEngine = new AudioEngine();
