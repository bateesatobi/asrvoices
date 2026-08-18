import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Grid, Chip, Stack, InputBase, Button, Paper,
  IconButton, CircularProgress, Tooltip, Slider,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search, MusicNote, PlayArrow, Pause, GraphicEq, VolumeUp,
  Movie, RecordVoiceOver,
} from '@mui/icons-material';
import { soundtracksAPI, BASE_URL } from '../../services/api';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

const MOOD_COLORS = {
  Professional: '#3b82f6',
  Calm: '#10b981',
  Energetic: '#E8A020',
  Epic: '#8b5cf6',
  Relaxed: '#ec4899',
  Rhythmic: '#f97316',
  Uplifting: '#eab308',
  Conversational: '#06b6d4',
  Neutral: '#64748b',
  Modern: '#6366f1',
  Friendly: '#22c55e',
  Tense: '#ef4444',
  Joyful: '#facc15',
  Zen: '#14b8a6',
  Authoritative: '#1e40af',
  Warm: '#fb923c',
  Contemporary: '#a855f7',
  Peaceful: '#34d399',
  Confident: '#0ea5e9',
  Emotional: '#c084fc',
};

function resolveTrackUrl(track) {
  const raw = track.preview_url || track.url || '';
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return `${BASE_URL}${raw}`;
  return `${BASE_URL}/bgm-stream/${track.filename || track.id}`;
}

function TrackCard({ track, isPlaying, onPlay, onUse }) {
  const moodColor = MOOD_COLORS[track.mood] || GOLD;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: isPlaying ? `2px solid ${GOLD}` : '1px solid rgba(17, 17, 17, 0.06)',
        background: isPlaying ? 'rgba(232, 160, 32, 0.04)' : '#ffffff',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': { borderColor: 'rgba(232, 160, 32, 0.35)', boxShadow: '0 8px 24px rgba(17,17,17,0.06)' },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: `${moodColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <MusicNote sx={{ color: moodColor, fontSize: 22 }} />
          <Tooltip title={isPlaying ? 'Pause' : 'Preview'}>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onPlay(track.id, resolveTrackUrl(track)); }}
              sx={{
                position: 'absolute',
                bottom: -6,
                right: -6,
                width: 26,
                height: 26,
                bgcolor: GOLD,
                color: '#111',
                border: '2px solid #fff',
                '&:hover': { bgcolor: GOLD_DARK },
              }}
            >
              {isPlaying ? <Pause sx={{ fontSize: 14 }} /> : <PlayArrow sx={{ fontSize: 14 }} />}
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111' }}>{track.name}</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>{track.genre}</Typography>
        </Box>
      </Stack>

      <Stack direction="row" spacing={0.75} sx={{ mb: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
        <Chip label={track.mood} size="small" sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, bgcolor: `${moodColor}15`, color: moodColor }} />
        {track.bpm && (
          <Chip label={`${track.bpm} BPM`} size="small" sx={{ height: 22, fontSize: '0.6875rem', bgcolor: '#f5f5f5', color: '#666' }} />
        )}
        {track.duration && (
          <Chip label={`${track.duration}s loop`} size="small" sx={{ height: 22, fontSize: '0.6875rem', bgcolor: '#fafafa', color: '#777' }} />
        )}
      </Stack>

      <Typography sx={{ fontSize: '0.75rem', color: '#999', mb: 1.5, flex: 1 }}>
        {track.license || 'Royalty-free within Avoices'}
      </Typography>

      <Button
        fullWidth
        size="small"
        variant="outlined"
        startIcon={<VolumeUp sx={{ fontSize: 16 }} />}
        onClick={() => onUse(track)}
        sx={{
          borderColor: 'rgba(232,160,32,0.4)',
          color: GOLD_DARK,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: '10px',
          '&:hover': { borderColor: GOLD, bgcolor: 'rgba(232,160,32,0.06)' },
        }}
      >
        Use in voiceover
      </Button>
    </Paper>
  );
}

export default function SoundtracksElevenLabs() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [moodFilter, setMoodFilter] = useState('all');
  const [playingId, setPlayingId] = useState(null);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    soundtracksAPI.getTracks()
      .then((data) => setTracks(data.tracks || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlayingId(null));
    return () => { audio.pause(); audio.src = ''; };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const handlePlay = useCallback((trackId, url) => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (playingId === trackId && !audio.paused) {
      audio.pause();
      setPlayingId(null);
      return;
    }
    audio.pause();
    audio.src = url;
    audio.loop = true;
    audio.play().then(() => setPlayingId(trackId)).catch(() => setPlayingId(null));
  }, [playingId]);

  const genres = useMemo(() => ['all', ...new Set(tracks.map((t) => t.genre).filter(Boolean))], [tracks]);
  const moods = useMemo(() => ['all', ...new Set(tracks.map((t) => t.mood).filter(Boolean))], [tracks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tracks.filter((t) => {
      const matchGenre = genreFilter === 'all' || t.genre === genreFilter;
      const matchMood = moodFilter === 'all' || t.mood === moodFilter;
      const matchSearch = !q || [t.name, t.genre, t.mood, ...(t.tags || [])].join(' ').toLowerCase().includes(q);
      return matchGenre && matchMood && matchSearch;
    });
  }, [tracks, search, genreFilter, moodFilter]);

  const handleUseTrack = (track) => {
    navigate('/dashboard/video-voiceover', { state: { bgmTrackId: track.id, bgmTrackName: track.name } });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: 'rgba(232,160,32,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <GraphicEq sx={{ color: GOLD_DARK, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.75rem' }, color: '#111' }}>
                Soundtracks
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                {tracks.length} royalty-free background tracks for voiceovers, slideshows &amp; videos
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<RecordVoiceOver />} onClick={() => navigate('/dashboard/video-voiceover')} sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '12px' }}>
            Voiceover studio
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2.5, borderRadius: '14px', border: '1px solid rgba(17,17,17,0.06)', bgcolor: '#fafafa' }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }} sx={{ mb: 1.5 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#fff', border: '1px solid #e8e8e8', borderRadius: '10px', px: 2, py: 1 }}>
            <Search sx={{ fontSize: 20, color: '#999' }} />
            <InputBase placeholder="Search by name, genre, mood…" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, fontSize: '0.875rem' }} />
            {loading && <CircularProgress size={18} sx={{ color: GOLD }} />}
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 140 }}>
            <VolumeUp sx={{ fontSize: 18, color: '#999' }} />
            <Slider size="small" value={volume} min={0} max={1} step={0.05} onChange={(_, v) => setVolume(v)} sx={{ width: 100, color: GOLD }} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', alignSelf: 'center', mr: 0.5 }}>GENRE</Typography>
          {genres.map((g) => (
            <Chip key={g} label={g === 'all' ? 'All genres' : g} size="small" onClick={() => setGenreFilter(g)} sx={{ height: 26, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', bgcolor: genreFilter === g ? GOLD : '#fff', color: genreFilter === g ? '#111' : '#555' }} />
          ))}
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#999', alignSelf: 'center', mr: 0.5 }}>MOOD</Typography>
          {moods.map((m) => (
            <Chip key={m} label={m === 'all' ? 'All moods' : m} size="small" onClick={() => setMoodFilter(m)} sx={{ height: 26, fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', bgcolor: moodFilter === m ? 'rgba(232,160,32,0.15)' : '#fff', color: moodFilter === m ? GOLD_DARK : '#555' }} />
          ))}
        </Stack>
      </Paper>

      <Typography sx={{ fontSize: '0.8125rem', color: '#888', mb: 2 }}>
        Showing {filtered.length} track{filtered.length !== 1 ? 's' : ''} · Not from ElevenLabs — hosted on Avoices (royalty-free for your projects)
      </Typography>

      {filtered.length === 0 && !loading ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '16px', border: '1px dashed #e0e0e0' }}>
          <Movie sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
          <Typography sx={{ fontWeight: 600, color: '#555' }}>No tracks yet</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#999', mt: 0.5 }}>Run the soundtrack generator on the backend to populate the library.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((track) => (
            <Grid item xs={12} sm={6} md={4} key={track.id}>
              <TrackCard track={track} isPlaying={playingId === track.id} onPlay={handlePlay} onUse={handleUseTrack} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
