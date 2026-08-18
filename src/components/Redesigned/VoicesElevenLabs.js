import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, Grid, Avatar, Chip, Stack, InputBase, Button, Paper,
  IconButton, CircularProgress, Tooltip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Search, Male, Female, RecordVoiceOver, Mic, ArrowForward, GraphicEq,
  PlayArrow, Pause, VolumeUp,
} from '@mui/icons-material';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../../constants/neural_config';
import { speakersAPI } from '../../services/api';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

function VoiceCard({ speaker, preview, isPlaying, onPlay, onUse }) {
  const langName = NEURAL_LANGUAGES.find((l) => l.code === speaker.lang)?.name || speaker.lang.toUpperCase();
  const isMale = speaker.gender === 'male';
  const hasPreview = Boolean(preview?.preview_url);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '16px',
        border: isPlaying ? `2px solid ${GOLD}` : '1px solid rgba(17, 17, 17, 0.06)',
        background: isPlaying ? 'rgba(232, 160, 32, 0.04)' : '#ffffff',
        transition: 'all 0.2s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          borderColor: isPlaying ? GOLD : 'rgba(232, 160, 32, 0.35)',
          boxShadow: '0 8px 24px rgba(17, 17, 17, 0.06)',
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Box sx={{ position: 'relative' }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              fontSize: '1rem',
              fontWeight: 700,
              background: speaker.color,
              color: '#fff',
            }}
          >
            {speaker.name[0]}
          </Avatar>
          {hasPreview && (
            <Tooltip title={isPlaying ? 'Pause preview' : 'Play preview'}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(speaker.id, preview.preview_url);
                }}
                sx={{
                  position: 'absolute',
                  bottom: -6,
                  right: -6,
                  width: 28,
                  height: 28,
                  background: GOLD,
                  color: '#111',
                  border: '2px solid #fff',
                  '&:hover': { background: GOLD_DARK },
                }}
              >
                {isPlaying ? <Pause sx={{ fontSize: 16 }} /> : <PlayArrow sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111', mb: 0.25 }}>
            {speaker.name}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {speaker.persona}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: isMale ? 'rgba(96,165,250,0.12)' : 'rgba(244,114,182,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isMale ? <Male sx={{ fontSize: 14, color: '#60a5fa' }} /> : <Female sx={{ fontSize: 14, color: '#f472b6' }} />}
        </Box>
      </Stack>

      {preview?.preview_text && (
        <Typography
          sx={{
            fontSize: '0.8125rem',
            color: '#555',
            lineHeight: 1.5,
            mb: 1.5,
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          "{preview.preview_text}"
        </Typography>
      )}

      <Stack direction="row" spacing={0.75} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.75 }}>
        <Chip
          label={langName}
          size="small"
          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, background: '#f5f5f5', color: '#555' }}
        />
        <Chip
          label={isMale ? 'Male' : 'Female'}
          size="small"
          sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, background: '#fafafa', color: '#777' }}
        />
        {hasPreview && (
          <Chip
            icon={<VolumeUp sx={{ fontSize: '14px !important' }} />}
            label="Preview"
            size="small"
            sx={{ height: 22, fontSize: '0.6875rem', fontWeight: 600, background: 'rgba(232,160,32,0.12)', color: GOLD_DARK }}
          />
        )}
      </Stack>

      <Button
        fullWidth
        variant="outlined"
        size="small"
        endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
        onClick={() => onUse(speaker)}
        sx={{
          mt: 'auto',
          borderColor: 'rgba(232, 160, 32, 0.4)',
          color: GOLD_DARK,
          fontWeight: 600,
          textTransform: 'none',
          borderRadius: '10px',
          '&:hover': { borderColor: GOLD, background: 'rgba(232, 160, 32, 0.06)' },
        }}
      >
        Use in Text to Speech
      </Button>
    </Paper>
  );
}

export default function VoicesElevenLabs() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [previewMap, setPreviewMap] = useState({});
  const [loadingPreviews, setLoadingPreviews] = useState(true);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    speakersAPI
      .getPreviews()
      .then((data) => {
        if (cancelled) return;
        const map = {};
        (data.speakers || []).forEach((s) => {
          if (s.id) map[s.id] = s;
        });
        setPreviewMap(map);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPreviews(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;
    audio.addEventListener('ended', () => setPlayingId(null));
    audio.addEventListener('pause', () => {
      if (audio.currentTime === 0 || audio.ended) setPlayingId(null);
    });
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handlePlay = useCallback((speakerId, url) => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    if (playingId === speakerId && !audio.paused) {
      audio.pause();
      setPlayingId(null);
      return;
    }

    audio.pause();
    audio.src = url;
    audio.play()
      .then(() => setPlayingId(speakerId))
      .catch(() => setPlayingId(null));
  }, [playingId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return NEURAL_SPEAKERS.filter((s) => {
      const langName = NEURAL_LANGUAGES.find((l) => l.code === s.lang)?.name || '';
      const previewText = previewMap[s.id]?.preview_text || '';
      const matchesLang = langFilter === 'all' || s.lang === langFilter;
      const matchesGender = genderFilter === 'all' || s.gender === genderFilter;
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        langName.toLowerCase().includes(q) ||
        s.persona.toLowerCase().includes(q) ||
        previewText.toLowerCase().includes(q);
      return matchesLang && matchesGender && matchesSearch;
    });
  }, [search, langFilter, genderFilter, previewMap]);

  const langCounts = useMemo(() => {
    const counts = { all: NEURAL_SPEAKERS.length };
    NEURAL_SPEAKERS.forEach((s) => {
      counts[s.lang] = (counts[s.lang] || 0) + 1;
    });
    return counts;
  }, []);

  const previewCount = useMemo(
    () => Object.values(previewMap).filter((p) => p.preview_url).length,
    [previewMap]
  );

  const handleUseVoice = (speaker) => {
    navigate('/dashboard/synthesize', { state: { voiceId: speaker.id } });
  };

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} sx={{ mb: 3 }}>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(232, 160, 32, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RecordVoiceOver sx={{ color: GOLD_DARK, fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.75rem' }, color: '#111', letterSpacing: '-0.02em' }}>
                Voices
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: '#666' }}>
                Browse {NEURAL_SPEAKERS.length} neural voices across African languages
                {previewCount > 0 && ` · ${previewCount} with audio previews`}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Button
          variant="contained"
          startIcon={<Mic />}
          onClick={() => navigate('/dashboard/voice-cloning')}
          sx={{
            background: GOLD,
            color: '#111',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: '12px',
            px: 2.5,
            boxShadow: 'none',
            '&:hover': { background: GOLD_DARK, boxShadow: 'none' },
          }}
        >
          Clone your voice
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2.5,
          borderRadius: '14px',
          border: '1px solid rgba(17, 17, 17, 0.06)',
          background: '#fafafa',
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: '10px',
              px: 2,
              py: 1,
            }}
          >
            <Search sx={{ fontSize: 20, color: '#999' }} />
            <InputBase
              placeholder="Search by name or language…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem' }}
            />
            {loadingPreviews && <CircularProgress size={18} sx={{ color: GOLD }} />}
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75 }}>
            {[
              { v: 'all', label: 'All' },
              { v: 'male', label: 'Male' },
              { v: 'female', label: 'Female' },
            ].map((g) => (
              <Chip
                key={g.v}
                label={g.label}
                size="small"
                onClick={() => setGenderFilter(g.v)}
                sx={{
                  height: 28,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  background: genderFilter === g.v ? GOLD : '#fff',
                  color: genderFilter === g.v ? '#111' : '#555',
                  border: genderFilter === g.v ? 'none' : '1px solid #e0e0e0',
                  '&:hover': { background: genderFilter === g.v ? GOLD_DARK : '#f5f5f5' },
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
          <Chip
            label={`All languages (${langCounts.all})`}
            size="small"
            onClick={() => setLangFilter('all')}
            icon={<GraphicEq sx={{ fontSize: '14px !important' }} />}
            sx={{
              height: 28,
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer',
              background: langFilter === 'all' ? 'rgba(232, 160, 32, 0.15)' : '#fff',
              color: langFilter === 'all' ? GOLD_DARK : '#555',
              border: langFilter === 'all' ? `1px solid ${GOLD}` : '1px solid #e0e0e0',
            }}
          />
          {NEURAL_LANGUAGES.filter((l) => l.code !== 'all' && langCounts[l.code]).map((l) => (
            <Chip
              key={l.code}
              label={`${l.name} (${langCounts[l.code]})`}
              size="small"
              onClick={() => setLangFilter(l.code)}
              sx={{
                height: 28,
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                background: langFilter === l.code ? 'rgba(232, 160, 32, 0.15)' : '#fff',
                color: langFilter === l.code ? GOLD_DARK : '#555',
                border: langFilter === l.code ? `1px solid ${GOLD}` : '1px solid #e0e0e0',
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Typography sx={{ fontSize: '0.8125rem', color: '#888', mb: 2 }}>
        Showing {filtered.length} voice{filtered.length !== 1 ? 's' : ''}
      </Typography>

      {filtered.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed #e0e0e0',
            background: '#fafafa',
          }}
        >
          <Typography sx={{ fontWeight: 600, color: '#555', mb: 0.5 }}>No voices match your filters</Typography>
          <Typography sx={{ fontSize: '0.875rem', color: '#999' }}>Try clearing search or selecting a different language.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((speaker) => (
            <Grid item xs={12} sm={6} md={4} key={speaker.id}>
              <VoiceCard
                speaker={speaker}
                preview={previewMap[speaker.id]}
                isPlaying={playingId === speaker.id}
                onPlay={handlePlay}
                onUse={handleUseVoice}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
