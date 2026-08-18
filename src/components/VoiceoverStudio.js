import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, TextField, IconButton, Stack,
  Grid, Chip, Fade, Alert, Avatar, InputBase, Slider,
  Tooltip, Collapse, Stepper, Step, StepLabel, StepContent, Paper,
  FormControl, Select, MenuItem, InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  AutoAwesome as AutoIcon,
  Close as CloseIcon,
  Search,
  Male, Female,
  CheckCircle,
  CheckCircleOutline,
  RecordVoiceOver,
  GraphicEq,
  VolumeUp,
  Tune,
  PauseCircleOutline,
  ExpandMore,
  ExpandLess,
  SpeedOutlined,
  MusicNote,
  DownloadForOffline,
  AccessTime,
  Spellcheck,
  Face,
  Face3,
  Face4,
  Face5,
  Face6,
  ViewCarousel,
  Image as ImageIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';
import { BASE_URL, ttsAPI, subscriptionAPI, videoAPI, getFriendlyErrorMessage } from '../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS } from '../constants/neural_config';
import { AC, G, GLASS, STEPPER_SX } from '../utils/mediaVault';
import { AvoicesBackdropLoader } from './progress';
import CreditEstimateChip from './CreditEstimateChip';
import { consumePipeline } from '../utils/pipelineHandoff';
import { UsageTip, useStudioTour } from './onboarding';
import { TOUR_IDS, voiceoverTour } from './onboarding/tours';

/* ─── Emotion presets ────────────────────────────────────────────────────── */
const EMOTIONS = [
  { id: 'neutral',       label: 'Neutral',      color: '#94a3b8' },
  { id: 'excited',       label: 'Excited',      color: AC },
  { id: 'calm',          label: 'Calm',         color: '#10b981' },
  { id: 'authoritative', label: 'Authoritative',color: AC },
  { id: 'whisper',       label: 'Whisper',      color: '#fbbf24' },
  { id: 'sad',           label: 'Sad',          color: '#d97706' },
];

const DEFAULT_BLOCK = (lang) => ({
  id: Date.now() + Math.random(),
  text: '',
  voice: NEURAL_SPEAKERS[0].id,
  language: lang || NEURAL_SPEAKERS[0].lang,
  pitch: 0,        // -20 to +20 semitones
  rate: 1.0,       // 0.5x – 2.0x
  volume: 1.0,     // 0 – 1
  emotion: 'neutral',
  pause: 0,        // pause in ms after this block
  audioUrl: null,
  loading: false,
  error: null,
  showControls: false,
});

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const estimateDuration = text => {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const secs = Math.round((words / 140) * 60); // avg 140 wpm
  if (secs < 60) return `~${secs}s`;
  return `~${Math.floor(secs / 60)}m ${secs % 60}s`;
};

/* ─── EQ bars ────────────────────────────────────────────────────────────── */
const EQ_ANIM = `
  @keyframes vo_eq0 { 0%,100%{height:3px} 50%{height:14px} }
  @keyframes vo_eq1 { 0%,100%{height:10px} 50%{height:4px} }
  @keyframes vo_eq2 { 0%,100%{height:6px} 50%{height:16px} }
  @keyframes vo_eq3 { 0%,100%{height:14px} 50%{height:5px} }
  @keyframes vo_eq4 { 0%,100%{height:4px} 50%{height:12px} }
  @keyframes vo_eq5 { 0%,100%{height:9px} 50%{height:3px} }
`;
function EqBars({ active, color = AC }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 16, flexShrink: 0 }}>
      <style>{EQ_ANIM}</style>
      {[0,1,2,3,4,5].map(i => (
        <Box key={i} sx={{
          width: 2.5, height: active ? [3,10,6,14,4,9][i] : 3, borderRadius: '2px',
          background: active ? color : 'rgba(17, 17, 17,0.15)',
          animation: active ? `vo_eq${i} ${0.55 + i * 0.08}s ease-in-out infinite` : 'none',
          transition: 'background 0.3s, height 0.3s',
        }} />
      ))}
    </Box>
  );
}

/* ─── Voice Card ─────────────────────────────────────────────────────────── */
function VoiceCard({ speaker, isSelected, onClick }) {
  const langName = NEURAL_LANGUAGES.find(l => l.code === speaker.lang)?.name || speaker.lang.toUpperCase();
  const isMale = speaker.gender === 'male';
  const faceIcons = [Face, Face3, Face4, Face5, Face6];
  const FaceIcon = faceIcons[speaker.id.length % faceIcons.length];
  return (
    <Box onClick={onClick} sx={{
      p: '9px 12px', borderRadius: '12px', cursor: 'pointer',
      border: isSelected ? `1.5px solid ${AC}` : '1px solid rgba(17, 17, 17, 0.05)',
      background: isSelected ? AC : 'rgba(17, 17, 17, 0.02)',
      boxShadow: isSelected ? `0 4px 15px -4px ${AC}66` : 'none',
      transition: 'all 0.18s cubic-bezier(0.4,0,0.2,1)',
      '&:hover': { background: isSelected ? AC : 'rgba(232, 160, 32,0.06)', borderColor: isSelected ? AC : 'rgba(232, 160, 32,0.28)', transform: 'translateY(-1px)' },
    }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar sx={{ width: 36, height: 36, fontSize: '1.2rem', fontWeight: 900, background: isSelected ? '#111111' : (isMale ? 'rgba(96,165,250,0.15)' : 'rgba(244,114,182,0.15)'), color: isSelected ? AC : (isMale ? '#60a5fa' : '#f472b6'), border: isSelected ? `2px solid ${AC}` : '2px solid rgba(17, 17, 17, 0.08)', transition: 'all 0.2s' }}>
            <FaceIcon sx={{ fontSize: 22 }} />
          </Avatar>
          {isSelected && <Box sx={{ position: 'absolute', bottom: -3, right: -3, width: 13, height: 13, borderRadius: '50%', background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${AC}` }}><CheckCircle sx={{ fontSize: 9, color: AC }} /></Box>}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: isSelected ? '#111111' : 'rgba(17, 17, 17, 0.82)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2, mb: 0.35 }}>{speaker.name}</Typography>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Chip label={langName} size="small" sx={{ height: 15, fontSize: '0.57rem', fontWeight: 800, background: isSelected ? 'rgba(17, 17, 17, 0.15)' : 'rgba(17, 17, 17, 0.06)', color: isSelected ? '#111111' : 'rgba(17, 17, 17, 0.38)', '& .MuiChip-label': { px: 0.75 }, border: isSelected ? '1px solid rgba(17,17,17,0.2)' : 'none' }} />
            <Box sx={{ width: 13, height: 13, borderRadius: '50%', background: isSelected ? 'rgba(17, 17, 17, 0.15)' : (isMale ? 'rgba(96,165,250,0.15)' : 'rgba(244,114,182,0.15)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isMale ? <Male sx={{ fontSize: 8, color: isSelected ? '#111111' : '#60a5fa' }} /> : <Female sx={{ fontSize: 8, color: isSelected ? '#111111' : '#f472b6' }} />}
            </Box>
          </Stack>
        </Box>
        <EqBars active={isSelected} color={isSelected ? '#111111' : AC} />
      </Stack>
    </Box>
  );
}

/* ─── Voice Panel ─────────────────────────────────────────────────────────── */
function VoicePanel({ selectedId, onSelect }) {
  const [search, setSearch]             = useState('');
  const [langFilter, setLangFilter]     = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');

  const filtered = NEURAL_SPEAKERS.filter(s => {
    const ml = langFilter === 'all' || s.lang === langFilter;
    const mg = genderFilter === 'all' || s.gender === genderFilter;
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase())
      || (NEURAL_LANGUAGES.find(l => l.code === s.lang)?.name || '').toLowerCase().includes(search.toLowerCase());
    return ml && mg && ms;
  });

  const selected = NEURAL_SPEAKERS.find(s => s.id === selectedId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: { xs: '400px', sm: '450px', md: '500px', lg: '550px' }, gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'rgba(17, 17, 17, 0.04)', border: '1px solid rgba(17, 17, 17, 0.07)', borderRadius: '12px', px: 1.5, py: 0.7 }}>
        <Search sx={{ fontSize: 15, color: 'rgba(17, 17, 17, 0.28)' }} />
        <InputBase placeholder="Search voices…" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1, fontSize: '0.85rem', color: '#111111', '& input::placeholder': { color: 'rgba(17, 17, 17, 0.28)' } }} />
        {search && <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.25, color: 'rgba(17, 17, 17, 0.28)' }}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>}
        <UsageTip
          placement="right"
          title="Search by voice name or language, then click a voice card to apply it to your blocks."
        />
      </Box>

      <Stack direction="row" spacing={0.6} sx={{ flexShrink: 0 }}>
        {[{ v: 'all', label: 'All' }, { v: 'male', label: '♂ Male' }, { v: 'female', label: '♀ Female' }].map(g => (
          <Chip key={g.v} label={g.label} size="small" onClick={() => setGenderFilter(g.v)} sx={{ height: 26, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', background: genderFilter === g.v ? AC : 'rgba(17, 17, 17, 0.05)', color: genderFilter === g.v ? '#fff' : 'rgba(17, 17, 17, 0.4)', border: '1px solid', borderColor: genderFilter === g.v ? AC : 'rgba(17, 17, 17, 0.07)', '& .MuiChip-label': { px: 1.2 }, '&:hover': { opacity: 0.85 } }} />
        ))}
      </Stack>

      <Box sx={{ overflowX: 'auto', flexShrink: 0, '&::-webkit-scrollbar': { display: 'none' }, pb: 0.5 }}>
        <Stack direction="row" spacing={0.75} sx={{ width: 'max-content' }}>
          {NEURAL_LANGUAGES.map(lang => (
            <Chip key={lang.code} label={lang.name} size="small" onClick={() => setLangFilter(lang.code)} sx={{ height: 24, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', background: langFilter === lang.code ? 'rgba(232, 160, 32,0.18)' : 'rgba(17, 17, 17, 0.04)', color: langFilter === lang.code ? AC : 'rgba(17, 17, 17, 0.42)', border: '1px solid', borderColor: langFilter === lang.code ? `${AC}50` : 'rgba(17, 17, 17, 0.06)', '& .MuiChip-label': { px: 1 }, '&:hover': { background: 'rgba(232, 160, 32,0.12)' } }} />
          ))}
        </Stack>
      </Box>

      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(17, 17, 17, 0.3)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>{filtered.length} voices</Typography>

      <Box sx={{ flex: 1, overflowY: 'auto', pr: 0.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { background: 'rgba(17, 17, 17, 0.1)', borderRadius: 4 } }}>
        <Grid container spacing={1.2}>
          {filtered.map(s => (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={s.id}>
              <VoiceCard speaker={s} isSelected={selectedId === s.id} onClick={() => onSelect(s)} />
            </Grid>
          ))}
        </Grid>
        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <RecordVoiceOver sx={{ fontSize: 32, color: 'rgba(17, 17, 17, 0.1)', mb: 1 }} />
            <Typography sx={{ color: 'rgba(17, 17, 17, 0.3)', fontSize: '0.85rem', fontWeight: 600 }}>No voices match</Typography>
          </Box>
        )}
      </Box>

      {selected && (
        <Box sx={{ flexShrink: 0, p: 1.5, borderRadius: '12px', background: 'rgba(232, 160, 32,0.07)', border: `1px solid ${AC}28` }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, fontSize: '1rem', fontWeight: 900, background: selected.gender === 'male' ? 'rgba(96,165,250,0.15)' : 'rgba(244,114,182,0.15)', color: selected.gender === 'male' ? '#60a5fa' : '#f472b6' }}>
              {(() => {
                const faceIcons = [Face, Face3, Face4, Face5, Face6];
                const FaceIcon = faceIcons[selected.id.length % faceIcons.length];
                return <FaceIcon sx={{ fontSize: 20 }} />;
              })()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#111111', lineHeight: 1 }}>{selected.name}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: AC, fontWeight: 700, mt: 0.2 }}>{NEURAL_LANGUAGES.find(l => l.code === selected.lang)?.name}</Typography>
            </Box>
            <GraphicEq sx={{ fontSize: 18, color: AC }} />
          </Stack>
        </Box>
      )}
    </Box>
  );
}

/* ─── Inline slider row ──────────────────────────────────────────────────── */
function ControlSlider({ icon, label, value, min, max, step, onChange, display, color = AC }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
        <Stack direction="row" spacing={0.75} alignItems="center">
          {icon}
          <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: 'rgba(17, 17, 17,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</Typography>
        </Stack>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color }}>{display}</Typography>
      </Stack>
      <Slider value={value} min={min} max={max} step={step} onChange={(_, v) => onChange(v)}
        sx={{ color, height: 3, '& .MuiSlider-thumb': { width: 12, height: 12 }, py: 0.5 }} />
    </Box>
  );
}

/* ─── Script Block ─────────────────────────────────────────────────────────── */
function ScriptBlock({ block, index, isFocused, onFocus, onUpdate, onRemove, onGenerate, speakerName, onSavePreset, onLoadPreset }) {
  const emotion = EMOTIONS.find(e => e.id === block.emotion) || EMOTIONS[0];
  const wordCount = block.text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <Fade in>
      <Box onClick={onFocus} sx={{
        ...GLASS, p: 2, cursor: 'pointer',
        border: isFocused ? `1.5px solid ${AC}` : '1px solid rgba(17, 17, 17, 0.05)',
        background: isFocused ? 'rgba(232,160,32,0.04)' : 'rgba(17, 17, 17,0.015)',
        boxShadow: isFocused ? `0 0 24px -8px ${AC}30` : 'none',
        transition: 'all 0.2s',
      }}>

        {/* Block header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Box sx={{ width: 22, height: 22, borderRadius: '6px', background: isFocused ? 'rgba(232,160,32,0.2)' : 'rgba(17, 17, 17, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '0.58rem', fontWeight: 900, color: isFocused ? AC : 'rgba(17, 17, 17,0.3)' }}>{String(index + 1).padStart(2, '0')}</Typography>
          </Box>

          {/* Emotion chips */}
          <Box sx={{ overflowX: 'auto', flex: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
            <Stack direction="row" spacing={0.5} sx={{ width: 'max-content' }}>
              {EMOTIONS.map(em => (
                <Chip key={em.id} label={em.label} size="small"
                  onClick={e => { e.stopPropagation(); onUpdate({ emotion: em.id }); }}
                  sx={{
                    height: 20, fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer',
                    background: block.emotion === em.id ? `${em.color}22` : 'transparent',
                    color: block.emotion === em.id ? em.color : 'rgba(17, 17, 17,0.25)',
                    border: '1px solid', borderColor: block.emotion === em.id ? `${em.color}55` : 'rgba(17, 17, 17,0.06)',
                    '& .MuiChip-label': { px: 1 },
                    '&:hover': { background: `${em.color}15`, color: em.color },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {block.audioUrl && <Box sx={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />}
        </Stack>

        {/* Text area */}
        <TextField
          fullWidth multiline rows={2}
          placeholder="Enter narration script…"
          value={block.text}
          onChange={e => onUpdate({ text: e.target.value })}
          onClick={e => e.stopPropagation()}
          sx={{
            mb: 1.5,
            '& .MuiOutlinedInput-root': {
              color: '#111111', borderRadius: '10px', fontSize: '0.92rem', background: 'transparent',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'rgba(232,160,32,0.2)' },
              '&.Mui-focused fieldset': { borderColor: `${AC}50` },
            },
          }}
        />

        {/* Footer row */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          {/* Left: meta + controls toggle */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Voice indicator */}
            <Box sx={{ px: 1, py: 0.4, borderRadius: '8px', background: 'rgba(232,160,32,0.08)', border: `1px solid ${AC}20` }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: AC }}>{speakerName}</Typography>
            </Box>
            {/* Emotion badge */}
            <Chip label={emotion.label} size="small" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, background: `${emotion.color}15`, color: emotion.color, border: `1px solid ${emotion.color}30`, '& .MuiChip-label': { px: 0.9 } }} />
            {wordCount > 0 && (
              <Stack direction="row" alignItems="center" spacing={0.4}>
                <AccessTime sx={{ fontSize: 11, color: 'rgba(17, 17, 17, 0.2)' }} />
                <Typography sx={{ fontSize: '0.62rem', color: 'rgba(17, 17, 17,0.25)', fontWeight: 600 }}>{estimateDuration(block.text)}</Typography>
              </Stack>
            )}
            <Tooltip title="Toggle controls">
              <IconButton size="small" onClick={e => { e.stopPropagation(); onUpdate({ showControls: !block.showControls }); }} sx={{ color: block.showControls ? AC : 'rgba(17, 17, 17, 0.2)', p: 0.4 }}>
                <Tune sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Stack>

          {/* Right: actions */}
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Tooltip title="Remove block">
              <IconButton size="small" onClick={e => { e.stopPropagation(); onRemove(); }} sx={{ color: 'rgba(17, 17, 17,0.15)', '&:hover': { color: '#f43f5e' }, p: 0.5 }}>
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            {block.audioUrl && (
              <Tooltip title="Preview">
                <IconButton size="small" onClick={e => { e.stopPropagation(); new Audio(block.audioUrl).play(); }} sx={{ background: 'rgba(232,160,32,0.12)', color: AC, p: 0.6, '&:hover': { background: 'rgba(232,160,32,0.22)' } }}>
                  <PlayIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            {block.audioUrl && (
              <Tooltip title="Download">
                <IconButton size="small" component="a" href={block.audioUrl} download sx={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', p: 0.6 }}>
                  <DownloadForOffline sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            )}
            <Button
              variant="contained" size="small"
              onClick={e => { e.stopPropagation(); onGenerate(); }}
              disabled={block.loading || !block.text.trim()}
              sx={{
                borderRadius: '9px', textTransform: 'none', fontWeight: 800, fontSize: '0.72rem', px: 2, py: 0.6,
                background: block.audioUrl ? 'rgba(16,185,129,0.12)' : G,
                color: block.audioUrl ? '#10b981' : '#fff',
                border: block.audioUrl ? '1px solid rgba(16,185,129,0.3)' : 'none',
                boxShadow: 'none',
                '&.Mui-disabled': { background: 'rgba(17, 17, 17,0.06)', color: 'rgba(17, 17, 17,0.25)' },
                '&:hover': { opacity: 0.88, boxShadow: 'none' },
              }}
            >
              {block.loading ? '⏳' : block.audioUrl ? '✓ Done' : 'Synthesize'}
            </Button>
          </Stack>
        </Stack>

        {/* Expanded performance controls */}
        <Collapse in={block.showControls}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(17, 17, 17,0.06)' }} onClick={e => e.stopPropagation()}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(17, 17, 17,0.3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Performance Tuning</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); onLoadPreset(); }} sx={{ fontSize: '0.65rem', py: 0.2, borderRadius: '6px', borderColor: 'rgba(232,160,32,0.3)', color: AC }}>Load Brand Preset</Button>
                <Button size="small" variant="contained" onClick={e => { e.stopPropagation(); onSavePreset(); }} sx={{ fontSize: '0.65rem', py: 0.2, borderRadius: '6px', background: 'rgba(232,160,32,0.1)', color: AC, boxShadow: 'none', '&:hover': { background: 'rgba(232,160,32,0.2)', boxShadow: 'none' } }}>Save as Preset</Button>
              </Stack>
            </Stack>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <ControlSlider
                  icon={<MusicNote sx={{ fontSize: 12, color: 'rgba(17, 17, 17,0.3)' }} />}
                  label="Pitch"
                  value={block.pitch} min={-20} max={20} step={1}
                  onChange={v => onUpdate({ pitch: v })}
                  display={block.pitch === 0 ? 'Default' : `${block.pitch > 0 ? '+' : ''}${block.pitch} st`}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <ControlSlider
                  icon={<SpeedOutlined sx={{ fontSize: 12, color: 'rgba(17, 17, 17,0.3)' }} />}
                  label="Speed"
                  value={block.rate} min={0.5} max={2.0} step={0.05}
                  onChange={v => onUpdate({ rate: v })}
                  display={`${block.rate.toFixed(2)}×`}
                  color="#E8A020"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <ControlSlider
                  icon={<VolumeUp sx={{ fontSize: 12, color: 'rgba(17, 17, 17,0.3)' }} />}
                  label="Volume"
                  value={block.volume} min={0} max={1} step={0.01}
                  onChange={v => onUpdate({ volume: v })}
                  display={`${Math.round(block.volume * 100)}%`}
                  color="#10b981"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <PauseCircleOutline sx={{ fontSize: 12, color: 'rgba(17, 17, 17,0.3)' }} />
                      <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: 'rgba(17, 17, 17,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>After-pause</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 900, color: '#E8A020' }}>
                      {block.pause === 0 ? 'None' : `${block.pause}ms`}
                    </Typography>
                  </Stack>
                  <Slider value={block.pause} min={0} max={3000} step={100} onChange={(_, v) => onUpdate({ pause: v })}
                    sx={{ color: '#E8A020', height: 3, '& .MuiSlider-thumb': { width: 12, height: 12 }, py: 0.5 }} />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography sx={{ fontSize: '0.63rem', fontWeight: 700, color: 'rgba(17, 17, 17,0.35)', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Spellcheck sx={{ fontSize: 12 }} /> Pronunciation
                </Typography>
                <TextField
                  fullWidth size="small"
                  placeholder='e.g., "Muganda" → "moo-GAN-da"'
                  onClick={e => e.stopPropagation()}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#111111', borderRadius: '8px', fontSize: '0.75rem', background: 'rgba(17, 17, 17,0.03)',
                      '& fieldset': { borderColor: 'rgba(17, 17, 17, 0.08)' },
                      '&.Mui-focused fieldset': { borderColor: `${AC}50` },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Collapse>

        {block.error && (
          <Typography sx={{ fontSize: '0.7rem', color: '#f87171', mt: 1 }}>{block.error}</Typography>
        )}
      </Box>
    </Fade>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function VoiceoverStudio({ userId }) {
  useStudioTour(TOUR_IDS.voiceover, voiceoverTour);
  const [blocks, setBlocks]                   = useState([DEFAULT_BLOCK(NEURAL_SPEAKERS[0].lang)]);
  const [userBalance, setUserBalance]         = useState(null);
  const [error, setError]                     = useState(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [videoUrl, setVideoUrl]               = useState(null);
  const [videoFile, setVideoFile]             = useState(null);
  const [focusedBlockId, setFocusedBlockId]   = useState(null);
  const [activeVoice, setActiveVoice]         = useState(NEURAL_SPEAKERS[0]);
  const [selectedLang, setSelectedLang]       = useState(NEURAL_SPEAKERS[0].lang);
  const [activeStep, setActiveStep]           = useState(0);

  // Slideshow Mode additions
  const [mode, setMode]                       = useState('narration'); // 'narration' or 'slideshow'
  const [imageFiles, setImageFiles]           = useState([]);
  const [slideshowUrl, setSlideshowUrl]       = useState(null);
  const [narrationMixUrl, setNarrationMixUrl] = useState(null);
  const [narrationVideoUrl, setNarrationVideoUrl] = useState(null);
  const [bgmEnabled, setBgmEnabled]           = useState(false);
  const [bgmTracks, setBgmTracks]             = useState([]);
  const [bgmLoading, setBgmLoading]           = useState(false);
  const [selectedBgm, setSelectedBgm]         = useState('');
  const [jobProgress, setJobProgress]         = useState({ status: '', progress: 0 });
  const [bgmPreviewId, setBgmPreviewId]       = useState(null);

  const videoRef = useRef(null);
  const bgmAudioRef = useRef(null);
  const slideshowPollRef = useRef(null);
  const fallbackTracks = [
    { id: 'Corporate.mp3', name: 'Corporate', url: '/bgm-stream/Corporate.mp3' },
    { id: 'Ambient.mp3', name: 'Ambient', url: '/bgm-stream/Ambient.mp3' },
    { id: 'Upbeat.mp3', name: 'Upbeat', url: '/bgm-stream/Upbeat.mp3' },
  ];

  const savePreset = (block) => {
    const preset = { pitch: block.pitch, rate: block.rate, volume: block.volume, pause: block.pause, emotion: block.emotion };
    localStorage.setItem('brand_voice_preset', JSON.stringify(preset));
    setError('Brand Voice Preset saved! You can now load this on any block.');
    setTimeout(() => setError(null), 3000);
  };

  const loadPreset = (blockId) => {
    const saved = localStorage.getItem('brand_voice_preset');
    if (saved) {
      updateBlock(blockId, JSON.parse(saved));
    } else {
      setError('No Brand Voice saved yet. Adjust sliders and click Save as Preset first.');
      setTimeout(() => setError(null), 3000);
    }
  };

  useEffect(() => {
    if (userId && subscriptionAPI.getBalance) {
      subscriptionAPI.getBalance(userId)
        .then(d => setUserBalance(d.balance ?? d.credit_balance ?? 0))
        .catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    const handoff = consumePipeline('voiceover');
    if (!handoff?.text) return;
    const lang = handoff.targetLang || handoff.sourceLang || NEURAL_SPEAKERS[0].lang;
    setSelectedLang(lang);
    setMode('narration');
    setBlocks([{
      ...DEFAULT_BLOCK(lang),
      text: String(handoff.text),
    }]);
    setActiveStep(1);
  }, []);

  useEffect(() => {
    setBgmLoading(true);
    videoAPI.getBgmTracks()
      .then(data => {
        const tracks = data?.tracks?.length ? data.tracks : fallbackTracks;
        setBgmTracks(tracks);
        if (tracks.length && !selectedBgm) setSelectedBgm(tracks[0].id);
      })
      .catch(() => {
        setBgmTracks(fallbackTracks);
        if (!selectedBgm) setSelectedBgm(fallbackTracks[0].id);
      })
      .finally(() => setBgmLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setBlocks(prev => prev.map(b => ({ ...b, language: selectedLang })));
  }, [selectedLang]);

  useEffect(() => {
    if (blocks.length > 0 && !focusedBlockId) {
      setFocusedBlockId(blocks[0].id);
    }
  }, [blocks, focusedBlockId]);

  const handleVideoUpload = e => {
    const file = e.target.files[0];
    if (file) { setVideoFile(file); setVideoUrl(URL.createObjectURL(file)); }
  };
  const removeVideo = () => { if (videoUrl) URL.revokeObjectURL(videoUrl); setVideoFile(null); setVideoUrl(null); };

  const handleImagesUpload = e => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newImages = files.map(f => ({ id: Date.now() + Math.random(), file: f, url: URL.createObjectURL(f) }));
    setImageFiles(prev => {
      const updated = [...prev, ...newImages];
      // Sync blocks if we have more images than blocks
      if (updated.length > blocks.length) {
        const extraBlocks = Array.from({ length: updated.length - blocks.length }).map(() => DEFAULT_BLOCK(selectedLang));
        setBlocks(b => [...b, ...extraBlocks]);
      }
      return updated;
    });
  };

  const removeImage = id => {
    setImageFiles(prev => {
      const removed = prev.find(img => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const moveImage = (index, dir) => {
    if (index + dir < 0 || index + dir >= imageFiles.length) return;
    setImageFiles(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[index + dir];
      copy[index + dir] = temp;
      return copy;
    });
  };

  const playBgmPreview = (track) => {
    try {
      if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current = null;
      }
      if (bgmPreviewId === track.id) {
        setBgmPreviewId(null);
        return;
      }
      const audio = new Audio(`${BASE_URL}${track.url}`);
      audio.onended = () => setBgmPreviewId(null);
      audio.play().catch(() => {
        setError('Failed to play BGM preview. Check that backend music files are available.');
      });
      bgmAudioRef.current = audio;
      setBgmPreviewId(track.id);
    } catch {
      setBgmPreviewId(null);
    }
  };

  const selectedBgmTrack = bgmTracks.find(t => t.id === selectedBgm);
  const selectedBgmPreviewUrl = selectedBgmTrack
    ? `${BASE_URL}${selectedBgmTrack.url}`
    : null;

  const stopSlideshowPoll = () => {
    if (slideshowPollRef.current) {
      clearInterval(slideshowPollRef.current);
      slideshowPollRef.current = null;
    }
  };

  const pollSlideshowJob = (jobId) => {
    stopSlideshowPoll();
    let attempts = 0;
    slideshowPollRef.current = setInterval(async () => {
      try {
        const job = await videoAPI.getJobStatus(jobId);
        const progress = Number.isFinite(job?.progress) ? job.progress : 0;
        setJobProgress({
          status: job?.status || 'processing',
          progress,
        });
        if (job?.status === 'completed' && job?.result?.slideshow_url) {
          setSlideshowUrl(job.result.slideshow_url);
          setBlocks(prev => prev.map((b, i) => (i < imageFiles.length ? { ...b, audioUrl: 'generated', loading: false } : b)));
          setIsGeneratingAll(false);
          setJobProgress({ status: 'completed', progress: 100 });
          if (job?.tts_degraded) {
            const tunnelMsg = 'Video exported, but narration failed (TTS server/ngrok unavailable). Restart your TTS service or try another language/voice.';
            setError(tunnelMsg);
            window.dispatchEvent(new CustomEvent('app-notification', {
              detail: { type: 'warning', title: 'Silent slides', message: tunnelMsg },
            }));
          }
          window.dispatchEvent(new CustomEvent('refresh-balance'));
          window.dispatchEvent(new CustomEvent('library-updated'));
          stopSlideshowPoll();
          return;
        }
        if (job?.status === 'error') {
          setError(job?.error || 'Slideshow render failed');
          setBlocks(prev => prev.map(b => ({ ...b, loading: false })));
          setIsGeneratingAll(false);
          setJobProgress({ status: 'error', progress: 0 });
          stopSlideshowPoll();
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('Render job was lost (server restarted). Please try again.');
          setBlocks(prev => prev.map(b => ({ ...b, loading: false })));
          setIsGeneratingAll(false);
          stopSlideshowPoll();
        }
      }
      attempts += 1;
      if (attempts > 240) {
        setError('Rendering is taking too long. Please retry.');
        setBlocks(prev => prev.map(b => ({ ...b, loading: false })));
        setIsGeneratingAll(false);
        stopSlideshowPoll();
      }
    }, 2000);
  };

  useEffect(() => () => stopSlideshowPoll(), []);

  const addBlock = () => {
    const nb = DEFAULT_BLOCK(selectedLang);
    setBlocks(prev => [...prev, nb]);
    setFocusedBlockId(nb.id);
  };

  const removeBlock = id => {
    if (blocks.length > 1) {
      setBlocks(prev => prev.filter(b => b.id !== id));
      if (focusedBlockId === id) setFocusedBlockId(blocks[0].id);
    }
  };

  const updateBlock = (id, updates) =>
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

  const generateBlock = async id => {
    const block = blocks.find(b => b.id === id);
    if (!block?.text.trim()) return;
    updateBlock(id, { loading: true, error: null });
    try {
      const res = await ttsAPI.synthesizeText(block.text, block.voice, block.language, userId);
      if (res.doc_id) pollAudio(id, res.doc_id);
      else if (res.audio_file_url) updateBlock(id, { audioUrl: res.audio_file_url, loading: false });
    } catch {
      updateBlock(id, { loading: false, error: 'Synthesis failed' });
    }
  };

  const pollAudio = async (blockId, docId) => {
    let attempts = 0;
    const iv = setInterval(async () => {
      try {
        const data = await ttsAPI.getAudio(docId);
        if (data.audio_files?.[0]?.audio_file_url) {
          updateBlock(blockId, { audioUrl: data.audio_files[0].audio_file_url, loading: false });
          window.dispatchEvent(new CustomEvent('refresh-balance'));
          clearInterval(iv);
        }
      } catch {}
      if (++attempts > 30) { updateBlock(blockId, { loading: false, error: 'Timed out' }); clearInterval(iv); }
    }, 2000);
  };

  const generateAll = async () => {
    if (mode === 'slideshow') {
      if (!imageFiles.length) return setError('Please upload at least one image.');
      if (blocks.length < imageFiles.length) return setError('Not enough script blocks for your images.');
      const populated = blocks.slice(0, imageFiles.length);
      if (populated.some(b => !b.text.trim())) return setError('All image blocks must have text.');
      
      setIsGeneratingAll(true);
      setError(null);
      setJobProgress({ status: 'starting', progress: 2 });
      setBlocks(prev => prev.map((b, i) => i < imageFiles.length ? { ...b, loading: true, error: null } : b));
      
      try {
        const segments = populated.map(b => ({ text: b.text, speaker_id: b.voice, target_lang: b.language, pitch: b.pitch, rate: b.rate }));
        const files = imageFiles.map(img => img.file);
        const res = await videoAPI.finalizeImageSlideshow(segments, userId, files, {
          bgmTrack: bgmEnabled ? selectedBgm : null
        });
        if (res?.job_id) {
          pollSlideshowJob(res.job_id);
        } else if (res?.slideshow_url) {
          setSlideshowUrl(res.slideshow_url);
          setBlocks(prev => prev.map((b, i) => i < imageFiles.length ? { ...b, audioUrl: 'generated', loading: false } : b));
          setIsGeneratingAll(false);
        } else {
          throw new Error('No render job received from server');
        }
      } catch (err) {
        setError(getFriendlyErrorMessage(err, 'Slideshow render failed'));
        setBlocks(prev => prev.map(b => ({ ...b, loading: false })));
        setJobProgress({ status: 'error', progress: 0 });
        setIsGeneratingAll(false);
      }
      return;
    }

    // Narration mode
    const populated = blocks.filter(b => b.text.trim());
    if (!populated.length) return;
    setIsGeneratingAll(true);
    setError(null);
    setNarrationMixUrl(null);
    setNarrationVideoUrl(null);
    setJobProgress({ status: 'synthesizing', progress: 15 });
    setBlocks(prev => prev.map(b => b.text.trim() ? { ...b, loading: true, error: null } : b));
    try {
      const res = await ttsAPI.renderVoiceover(
        populated.map(b => ({ text: b.text, speaker_id: b.voice, language: b.language, pitch: b.pitch, rate: b.rate })),
        userId,
        `Narration – ${new Date().toLocaleString()}`,
        bgmEnabled ? selectedBgm : null
      );
      if (res.segments) {
        let idx = 0;
        setBlocks(prev => prev.map(b => {
          if (!b.text.trim()) return b;
          const seg = res.segments[idx++];
          return { ...b, audioUrl: seg?.audio_url || null, loading: false, error: seg?.status === 'failed' ? seg.error || 'Failed' : null };
        }));
        window.dispatchEvent(new CustomEvent('refresh-balance'));
        window.dispatchEvent(new CustomEvent('library-updated'));
        if (res.combined_audio_url) setNarrationMixUrl(res.combined_audio_url);
        setJobProgress({ status: 'synthesizing', progress: 55 });

        if (videoFile && res.doc_id) {
          setJobProgress({ status: 'muxing', progress: 75 });
          try {
            const videoRes = await videoAPI.finalizeNarrationVideo(
              res.doc_id,
              userId,
              videoFile,
              { bgmTrack: bgmEnabled ? selectedBgm : null }
            );
            if (videoRes.narration_video_url) {
              setNarrationVideoUrl(videoRes.narration_video_url);
            }
          } catch (videoErr) {
            const detail = videoErr.response?.data?.detail;
            const msg = typeof detail === 'string' ? detail : 'Video export failed. Your narration audio was still generated.';
            setError(msg);
          }
        }
        setJobProgress({ status: 'completed', progress: 100 });
        setActiveStep(4);
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Batch render failed'));
      setBlocks(prev => prev.map(b => ({ ...b, loading: false })));
      setJobProgress({ status: 'error', progress: 0 });
    }
    setIsGeneratingAll(false);
  };

  const handleVoiceSelect = s => {
    setActiveVoice(s);
    setBlocks(prev => prev.map(b => ({ ...b, voice: s.id })));
  };

  const focusedBlock = blocks.find(b => b.id === focusedBlockId) || blocks[0];

  // Stats
  const totalWords  = blocks.reduce((a, b) => a + b.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const doneBlocks  = blocks.filter(b => b.audioUrl).length;
  const totalBlocks = blocks.length;

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setBlocks([DEFAULT_BLOCK(selectedLang)]);
    setVideoUrl(null);
    setVideoFile(null);
    setImageFiles([]);
    setSlideshowUrl(null);
    setNarrationMixUrl(null);
    setNarrationVideoUrl(null);
    setJobProgress({ status: '', progress: 0 });
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current = null;
    }
    setBgmPreviewId(null);
    setError(null);
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, minHeight: '100vh', background: 'transparent', color: '#111111' }}>

      {error && <Alert severity={error.includes('saved') ? 'success' : 'error'} onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '12px', background: error.includes('saved') ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${error.includes('saved') ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}`, color: error.includes('saved') ? '#10b981' : '#f87171' }}>{error}</Alert>}

      {/* ── Mode Selection ── */}
      <Box data-tour="studio-mode" sx={{ display: 'flex', gap: 1, mb: 3, background: 'rgba(17,17,17,0.03)', p: 0.5, borderRadius: '12px', width: 'fit-content' }}>
        <Button variant={mode === 'narration' ? 'contained' : 'text'} onClick={() => setMode('narration')} startIcon={<GraphicEq sx={{ fontSize: 16 }} />} sx={{ borderRadius: '10px', px: 2, py: 0.8, textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', background: mode === 'narration' ? '#fff' : 'transparent', color: mode === 'narration' ? AC : 'rgba(17,17,17,0.4)', boxShadow: mode === 'narration' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', '&:hover': { background: mode === 'narration' ? '#fff' : 'rgba(17,17,17,0.05)' } }}>Narration Mode</Button>
        <Button variant={mode === 'slideshow' ? 'contained' : 'text'} onClick={() => setMode('slideshow')} startIcon={<ViewCarousel sx={{ fontSize: 16 }} />} sx={{ borderRadius: '10px', px: 2, py: 0.8, textTransform: 'none', fontWeight: 800, fontSize: '0.8rem', background: mode === 'slideshow' ? '#fff' : 'transparent', color: mode === 'slideshow' ? AC : 'rgba(17,17,17,0.4)', boxShadow: mode === 'slideshow' ? '0 2px 10px rgba(0,0,0,0.05)' : 'none', '&:hover': { background: mode === 'slideshow' ? '#fff' : 'rgba(17,17,17,0.05)' } }}>Slideshow Mode</Button>
      </Box>

      {/* ── Stepper ── */}
      <Stepper data-tour="studio-flow" activeStep={activeStep} orientation="vertical" sx={{ mb: 3, ...STEPPER_SX }}>
        
        {/* Step 1: Upload Images or Reference Video */}
        <Step>
          <StepLabel>Step 1: {mode === 'slideshow' ? 'Upload Images' : 'Upload Reference Video (Optional)'}</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              {mode === 'slideshow' ? (
                <Box>
                  <Box sx={{ textAlign: 'center', py: 4, mb: 3, border: '1px dashed rgba(17, 17, 17,0.1)', borderRadius: '12px', background: 'rgba(17,17,17,0.02)' }}>
                    <ImageIcon sx={{ fontSize: 32, color: 'rgba(17, 17, 17,0.2)', mb: 1 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(17, 17, 17,0.4)', mb: 2, fontWeight: 600 }}>Upload images to create a slideshow voiceover</Typography>
                    <Button component="label" variant="contained" size="small" sx={{ background: G, borderRadius: '10px', textTransform: 'none', fontWeight: 800, fontSize: '0.75rem', boxShadow: '0 4px 15px rgba(232,160,32,0.2)' }}>
                      Select Images
                      <input type="file" hidden accept="image/*" multiple onChange={handleImagesUpload} />
                    </Button>
                  </Box>
                  {imageFiles.length > 0 && (
                    <Box>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(17, 17, 17,0.3)', mb: 1.5 }}>{imageFiles.length} Images Added (Drag to reorder)</Typography>
                      <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 } }}>
                        {imageFiles.map((img, i) => (
                          <Box key={img.id} sx={{ position: 'relative', width: 120, height: 80, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '2px solid rgba(17,17,17,0.05)', '&:hover .img-actions': { opacity: 1 } }}>
                            <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <Box className="img-actions" sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => moveImage(i, -1)} disabled={i === 0} sx={{ color: '#fff', background: 'rgba(255,255,255,0.2)', p: 0.3 }}><KeyboardArrowLeft sx={{ fontSize: 14 }} /></IconButton>
                              <IconButton size="small" onClick={() => removeImage(img.id)} sx={{ color: '#f87171', background: 'rgba(255,255,255,0.2)', p: 0.3 }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                              <IconButton size="small" onClick={() => moveImage(i, 1)} disabled={i === imageFiles.length - 1} sx={{ color: '#fff', background: 'rgba(255,255,255,0.2)', p: 0.3 }}><KeyboardArrowRight sx={{ fontSize: 14 }} /></IconButton>
                            </Box>
                            <Box sx={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.55rem', fontWeight: 900, px: 0.6, py: 0.2, borderRadius: '4px' }}>{i + 1}</Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box>
                  {videoUrl ? (
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(17, 17, 17,0.3)' }}>Reference Monitor</Typography>
                        <Button size="small" onClick={removeVideo} sx={{ color: 'rgba(17, 17, 17,0.25)', fontSize: '0.7rem' }}>Remove</Button>
                      </Stack>
                      <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
                        <video ref={videoRef} controls src={videoUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6, border: '1px dashed rgba(17, 17, 17,0.06)', borderRadius: '12px' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: 'rgba(17, 17, 17,0.25)', mb: 1.25, fontWeight: 600 }}>Reference Video <span style={{ opacity: 0.5 }}>· optional</span></Typography>
                      <Button component="label" variant="outlined" size="small" sx={{ borderRadius: '10px', textTransform: 'none', color: AC, borderColor: `${AC}40`, fontWeight: 800, fontSize: '0.77rem', '&:hover': { background: 'rgba(232,160,32,0.08)', borderColor: AC } }}>
                        Upload Video
                        <input type="file" hidden accept="video/*" onChange={handleVideoUpload} />
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
            <Stack direction="row" spacing={1}>
              <Button disabled={activeStep === 0} onClick={handleBack} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={mode === 'slideshow' && imageFiles.length === 0} sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 18px rgba(232,160,32,0.25)' }}>Next</Button>
            </Stack>
          </StepContent>
        </Step>

        {/* Step 2: Create Script Blocks */}
        <Step>
          <StepLabel>Step 2: Create Script Blocks</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '0.64rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(17, 17, 17,0.25)' }}>
                  Script Editor
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(17, 17, 17,0.5)' }}>Language</InputLabel>
                      <Select
                        value={selectedLang}
                        onChange={e => setSelectedLang(e.target.value)}
                        label="Language"
                        sx={{ fontSize: '0.75rem', fontWeight: 700, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      >
                        {NEURAL_LANGUAGES.map(lang => (
                          <MenuItem key={lang.code} value={lang.code} sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {lang.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <UsageTip
                      placement="right"
                      title="Sets the spoken language for your blocks. Pick any voice in the next step — speaker native language and output language are independent."
                    />
                  </Stack>
                  <Button size="small" startIcon={<AddIcon sx={{ fontSize: 14 }} />} onClick={addBlock} sx={{ color: AC, fontWeight: 800, textTransform: 'none', fontSize: '0.77rem', '&:hover': { background: 'rgba(232,160,32,0.08)' } }}>
                    Add Block
                  </Button>
                </Stack>
              </Stack>

              <Stack spacing={1.25}>
                {blocks.map((block, index) => (
                  <ScriptBlock
                    key={block.id} block={block} index={index}
                    isFocused={focusedBlockId === block.id}
                    onFocus={() => setFocusedBlockId(block.id)}
                    onUpdate={updates => updateBlock(block.id, updates)}
                    onRemove={() => removeBlock(block.id)}
                    onGenerate={() => generateBlock(block.id)}
                    speakerName={NEURAL_SPEAKERS.find(s => s.id === block.voice)?.name || 'Select Voice'}
                    onSavePreset={() => savePreset(block)}
                    onLoadPreset={() => loadPreset(block.id)}
                  />
                ))}
              </Stack>
            </Paper>
            <Stack direction="row" spacing={1}>
              <Button disabled={activeStep === 0} onClick={handleBack} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>Back</Button>
              <Button variant="contained" onClick={handleNext} sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 18px rgba(232,160,32,0.25)' }}>Next</Button>
            </Stack>
          </StepContent>
        </Step>

        {/* Step 3: Select Voices & Configure */}
        <Step>
          <StepLabel>Step 3: Select Voices & Configure</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 3, fontWeight: 600 }}>
                Choose the voice for each script block. You can customize pitch, speed, and volume for individual blocks.
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={12} lg={12}>
                  <VoicePanel selectedId={focusedBlock?.voice || activeVoice.id} onSelect={handleVoiceSelect} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleNext} sx={{ background: G, color: '#fff', fontWeight: 800, px: 4, borderRadius: '8px' }}>
                  Next Step
                </Button>
                <Button onClick={handleBack} sx={{ color: 'rgba(17,17,17,0.6)', fontWeight: 700 }}>Back</Button>
              </Box>
            </Paper>
          </StepContent>
        </Step>

        {/* Step 4: Generate Audio */}
        <Step>
          <StepLabel>Step 4: Generate Audio</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1, textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.9rem', color: 'rgba(17,17,17,0.6)', mb: 2 }}>Generate audio for all script blocks using your selected voices.</Typography>
              <Box sx={{ ...GLASS, p: 2, borderRadius: '12px', mb: 2, textAlign: 'left' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(17,17,17,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Background Music
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => setBgmEnabled(v => !v)}
                    sx={{
                      borderRadius: '999px',
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      px: 1.5,
                      bgcolor: bgmEnabled ? 'rgba(16,185,129,0.12)' : 'rgba(17,17,17,0.06)',
                      color: bgmEnabled ? '#059669' : 'rgba(17,17,17,0.45)'
                    }}
                  >
                    {bgmEnabled ? 'Music On' : 'No Music'}
                  </Button>
                </Stack>
                {bgmEnabled && (
                  <Stack spacing={1.25}>
                    {bgmLoading && (
                      <Typography sx={{ fontSize: '0.74rem', color: 'rgba(17,17,17,0.5)' }}>
                        Loading music tracks...
                      </Typography>
                    )}
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '0.75rem' }}>Track</InputLabel>
                      <Select
                        value={selectedBgm}
                        label="Track"
                        onChange={(e) => setSelectedBgm(e.target.value)}
                      >
                        {bgmTracks.map(track => (
                          <MenuItem key={track.id} value={track.id}>
                            {track.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {bgmTracks.map(track => (
                        <Button
                          key={track.id}
                          size="small"
                          variant={selectedBgm === track.id ? 'contained' : 'outlined'}
                          startIcon={<MusicNote sx={{ fontSize: 14 }} />}
                          onClick={() => {
                            setSelectedBgm(track.id);
                            playBgmPreview(track);
                          }}
                          sx={{
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            background: selectedBgm === track.id ? G : undefined,
                            color: selectedBgm === track.id ? '#fff' : undefined
                          }}
                        >
                          {bgmPreviewId === track.id ? `Stop ${track.name}` : `Sample ${track.name}`}
                        </Button>
                      ))}
                    </Stack>
                    {selectedBgmPreviewUrl && (
                      <Box sx={{ p: 1.5, borderRadius: '10px', background: 'rgba(17,17,17,0.03)', border: '1px solid rgba(17,17,17,0.08)' }}>
                        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(17,17,17,0.6)', mb: 1 }}>
                          Selected track sample: {selectedBgmTrack?.name}
                        </Typography>
                        <audio controls preload="none" src={selectedBgmPreviewUrl} style={{ width: '100%' }} />
                      </Box>
                    )}
                    {!bgmTracks.length && !bgmLoading && (
                      <Typography sx={{ fontSize: '0.74rem', color: '#f87171' }}>
                        No music tracks found. Add files under backend assets/bgm.
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
              <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
                {mode === 'narration' ? (
                  <CreditEstimateChip
                    service="voiceover_batch"
                    quantity={blocks.reduce((a, b) => a + (b.text?.trim().length || 0), 0)}
                    balance={userBalance}
                  />
                ) : (
                  <CreditEstimateChip
                    service="video_dubbing"
                    quantity={Math.max(imageFiles.length * 0.5, 0.5)}
                    balance={userBalance}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained" startIcon={<AutoIcon sx={{ fontSize: 16 }} />}
                  onClick={generateAll} disabled={isGeneratingAll}
                  sx={{ background: G, borderRadius: '10px', fontWeight: 900, fontSize: '0.8rem', px: 2.5, py: 0.9, textTransform: 'none', boxShadow: '0 4px 18px rgba(232,160,32,0.25)', '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 24px rgba(232,160,32,0.4)' }, '&.Mui-disabled': { background: 'rgba(17, 17, 17,0.07)', color: 'rgba(17, 17, 17,0.3)' } }}
                >
                  {isGeneratingAll ? 'Rendering…' : 'Render All'}
                </Button>
              </Stack>
              {doneBlocks > 0 && !isGeneratingAll && (
                <Typography sx={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, mt: 2 }}>{doneBlocks}/{totalBlocks} blocks rendered</Typography>
              )}
            </Paper>
            <Stack direction="row" spacing={1}>
              <Button disabled={activeStep === 0} onClick={handleBack} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>Back</Button>
              <Button variant="contained" onClick={handleNext} disabled={doneBlocks === 0} sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', boxShadow: '0 4px 18px rgba(232,160,32,0.25)' }}>Next</Button>
            </Stack>
          </StepContent>
        </Step>

        {/* Step 5: Preview & Download */}
        <Step>
          <StepLabel>Step 5: Preview & Download</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 4, mb: 2, ...GLASS, mt: 1, textAlign: 'center' }}>
              <CheckCircleOutline sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#111111', mb: 1 }}>
                {mode === 'slideshow' ? 'Slideshow Complete!' : 'Narration Complete!'}
              </Typography>
              <Typography sx={{ fontSize: '0.9rem', color: 'rgba(17,17,17,0.6)', mb: 4 }}>
                {mode === 'slideshow'
                  ? 'Your image slideshow with voiceover has been successfully generated.'
                  : narrationVideoUrl
                    ? 'Your video with AI narration has been successfully generated (original audio replaced).'
                    : 'Your voiceover has been successfully generated.'}
              </Typography>

              {mode === 'slideshow' && slideshowUrl ? (
                <Box sx={{ maxWidth: 640, mx: 'auto', mb: 4 }}>
                  <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden', mb: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <video controls src={slideshowUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                  </Box>
                  <Button variant="contained" startIcon={<DownloadForOffline />} component="a" href={slideshowUrl} download sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', px: 3, boxShadow: '0 4px 15px rgba(232,160,32,0.2)' }}>
                    Download Slideshow Video
                  </Button>
                </Box>
              ) : narrationVideoUrl ? (
                <Box sx={{ maxWidth: 640, mx: 'auto', mb: 4 }}>
                  <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000', borderRadius: '12px', overflow: 'hidden', mb: 2, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                    <video controls src={narrationVideoUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                  </Box>
                  <Button variant="contained" startIcon={<DownloadForOffline />} component="a" href={narrationVideoUrl} download sx={{ background: G, borderRadius: '10px', fontWeight: 800, textTransform: 'none', px: 3, boxShadow: '0 4px 15px rgba(232,160,32,0.2)' }}>
                    Download Narration Video
                  </Button>
                </Box>
              ) : (
                <Stack spacing={1.25} sx={{ maxWidth: 600, mx: 'auto' }}>
                  {narrationMixUrl && (
                    <Box sx={{ p: 2, borderRadius: '10px', background: 'rgba(232,160,32,0.06)', border: '1px solid rgba(232,160,32,0.2)' }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: AC, mb: 1 }}>Final Mixed Narration (with music)</Typography>
                      <audio controls src={narrationMixUrl} style={{ width: '100%' }} />
                      <Button
                        size="small"
                        startIcon={<DownloadForOffline />}
                        component="a"
                        href={narrationMixUrl}
                        download
                        sx={{ mt: 1, textTransform: 'none', fontWeight: 700 }}
                      >
                        Download final mix
                      </Button>
                    </Box>
                  )}
                  {blocks.filter(b => b.audioUrl).map((block, index) => (
                    <Box key={block.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '10px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(17,17,17,0.5)', minWidth: 40 }}>#{index + 1}</Typography>
                      <Typography sx={{ fontSize: '0.75rem', color: '#111111', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.text}</Typography>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Preview">
                          <IconButton size="small" onClick={() => new Audio(block.audioUrl).play()} sx={{ background: 'rgba(232,160,32,0.12)', color: AC, p: 0.6 }}>
                            <PlayIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" component="a" href={block.audioUrl} download sx={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', p: 0.6 }}>
                            <DownloadForOffline sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              )}

              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                <Button variant="outlined" onClick={handleBack} sx={{ borderColor: 'rgba(17,17,17,0.2)', color: 'rgba(17,17,17,0.7)', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px' }}>
                  Back
                </Button>
                <Button variant="outlined" onClick={handleReset} sx={{ borderColor: 'rgba(17,17,17,0.2)', color: 'rgba(17,17,17,0.7)', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px' }}>
                  Start Over
                </Button>
              </Stack>
            </Paper>
          </StepContent>
        </Step>

      </Stepper>
      
      <AvoicesBackdropLoader
        open={isGeneratingAll}
        message={
          mode === 'slideshow'
            ? 'Building Slideshow…'
            : jobProgress.status === 'muxing'
              ? 'Combining Video…'
              : 'Rendering Audio…'
        }
        submessage={
          mode === 'slideshow'
            ? ({
                starting: 'Preparing slides and narration…',
                synthesizing: 'Synthesizing voice for each slide…',
                rendering: 'Rendering video segments…',
                uploading: 'Uploading final slideshow…',
                completed: 'Slideshow ready',
                error: 'Render failed',
              }[jobProgress.status] || 'Processing your slideshow…')
            : ({
                synthesizing: 'Generating high-fidelity audio for your blocks…',
                muxing: 'Replacing original video audio with your narration…',
                completed: 'Finishing up…',
              }[jobProgress.status] || 'Processing your narration…')
        }
        progress={
          mode === 'slideshow' && jobProgress.progress > 0
            ? jobProgress.progress
            : mode === 'narration' && jobProgress.progress > 0
              ? jobProgress.progress
              : undefined
        }
      />
    </Box>
  );
}
