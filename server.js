import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DIST = path.join(__dirname, 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
}

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { tracks: [], playlists: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Tracks
app.get('/api/tracks', (req, res) => {
  const data = readData();
  res.json(data.tracks);
});

app.post('/api/tracks', (req, res) => {
  const data = readData();
  const track = req.body;
  data.tracks.push(track);
  writeData(data);
  res.json(track);
});

app.put('/api/tracks/:id', (req, res) => {
  const data = readData();
  const index = data.tracks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Track not found' });
  data.tracks[index] = { ...data.tracks[index], ...req.body };
  writeData(data);
  res.json(data.tracks[index]);
});

app.delete('/api/tracks/:id', (req, res) => {
  const data = readData();
  data.tracks = data.tracks.filter((t) => t.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// Playlists
app.get('/api/playlists', (req, res) => {
  const data = readData();
  res.json(data.playlists);
});

app.post('/api/playlists', (req, res) => {
  const data = readData();
  const playlist = req.body;
  data.playlists.push(playlist);
  writeData(data);
  res.json(playlist);
});

app.put('/api/playlists/:id', (req, res) => {
  const data = readData();
  const index = data.playlists.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    const playlist = { ...req.body, id: req.params.id };
    data.playlists.push(playlist);
    writeData(data);
    return res.json(playlist);
  }
  data.playlists[index] = { ...data.playlists[index], ...req.body };
  writeData(data);
  res.json(data.playlists[index]);
});

app.delete('/api/playlists/:id', (req, res) => {
  const data = readData();
  data.playlists = data.playlists.filter((p) => p.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// Polling endpoint: get tracks added after a timestamp
app.get('/api/tracks/since/:timestamp', (req, res) => {
  const data = readData();
  const since = Number(req.params.timestamp);
  const newTracks = data.tracks.filter((t) => {
    const createdAt = Number(t.id.split('-')[1]) || 0;
    return createdAt > since;
  });
  res.json(newTracks);
});

// SPA fallback - serve index.html for all non-API routes
if (fs.existsSync(DIST)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
