import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  AutoAwesome,
  CheckCircle,
  CloudUpload,
  Close,
  Language as LanguageIcon,
  PlayArrow,
  Search,
  RecordVoiceOver,
  Videocam,
} from '@mui/icons-material';
import {
  AD_CREATIVE_CATEGORIES,
  AD_CREATIVE_LANGUAGES,
  AD_CREATIVE_TEMPLATES,
  countTemplatesInCategory,
  getAdCreativeTemplate,
  isVideoTemplate,
} from '../../data/adCreativeTemplates';
import { NEURAL_SPEAKERS } from '../../constants/neural_config';
import StudioHeroBanner from '../Layout/StudioHeroBanner';
import { STUDIO_VISUALS } from '../../data/studioVisuals';

const GOLD = '#E8A020';
const GOLD_DARK = '#C47F10';

function voicesForLang(voiceLang) {
  const list = NEURAL_SPEAKERS.filter((s) => s.lang === voiceLang);
  if (list.length) return list.slice(0, 12);
  return NEURAL_SPEAKERS.filter((s) => s.lang === 'en').slice(0, 8);
}

function isVideoFile(file) {
  return Boolean(file?.type?.startsWith('video/'));
}

function slotAccept(type = 'image') {
  if (type === 'video') return 'video/mp4,video/webm,video/quicktime';
  if (type === 'either') return 'image/*,video/mp4,video/webm,video/quicktime';
  return 'image/*';
}

function slotAddLabel(type = 'image') {
  if (type === 'video') return 'Add short video';
  if (type === 'either') return 'Add image or video';
  return 'Add image';
}

function CoverMedia({ src, videoSrc, className, sx }) {
  const [usePoster, setUsePoster] = useState(!videoSrc);
  useEffect(() => {
    setUsePoster(!videoSrc);
  }, [videoSrc]);
  if (videoSrc && !usePoster) {
    return (
      <Box
        className={className}
        component="video"
        src={videoSrc}
        poster={src}
        muted
        loop
        playsInline
        autoPlay
        onError={() => setUsePoster(true)}
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...sx }}
      />
    );
  }
  return (
    <Box
      className={className}
      component="img"
      src={src}
      alt=""
      sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...sx }}
    />
  );
}

function SlotDrop({ slot, file, previewUrl, onPick, onClear }) {
  const type = slot.type || 'image';
  const video = isVideoFile(file);
  return (
    <Box>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#444', mb: 0.75 }}>
        {slot.label}
      </Typography>
      <Box
        component="label"
        sx={{
          display: 'block',
          borderRadius: '14px',
          overflow: 'hidden',
          border: previewUrl ? '1px solid #e8e8e8' : '1.5px dashed #d0d0d0',
          bgcolor: previewUrl ? '#111' : '#fafafa',
          cursor: 'pointer',
          position: 'relative',
          aspectRatio: '4 / 3',
          transition: 'border-color 0.15s, background 0.15s',
          '&:hover': { borderColor: GOLD },
        }}
      >
        <input
          type="file"
          accept={slotAccept(type)}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(slot.id, f);
            e.target.value = '';
          }}
        />
        {previewUrl ? (
          <>
            {video ? (
              <Box
                component="video"
                src={previewUrl}
                muted
                loop
                playsInline
                autoPlay
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Box
                component="img"
                src={previewUrl}
                alt={slot.label}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            )}
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear(slot.id);
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.55)',
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
            <Chip
              label={file?.name || (video ? 'Video' : 'Image')}
              size="small"
              sx={{
                position: 'absolute',
                left: 8,
                bottom: 8,
                maxWidth: '70%',
                bgcolor: 'rgba(255,255,255,0.92)',
                fontSize: '0.65rem',
                fontWeight: 600,
              }}
            />
          </>
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', px: 2, textAlign: 'center' }}>
            {type === 'image' ? (
              <CloudUpload sx={{ color: GOLD_DARK, mb: 0.75 }} />
            ) : (
              <Videocam sx={{ color: GOLD_DARK, mb: 0.75 }} />
            )}
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#222' }}>
              {slotAddLabel(type)}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: '#888', mt: 0.35 }}>{slot.hint}</Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

function TemplateCard({ template, onOpen }) {
  return (
    <Paper
      elevation={0}
      onClick={() => onOpen(template.id)}
      sx={{
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid #ececec',
        cursor: 'pointer',
        bgcolor: '#fff',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 18px 40px rgba(17,17,17,0.08)',
        },
        '&:hover .cover': { transform: 'scale(1.04)' },
      }}
    >
      <Box sx={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', bgcolor: '#111' }}>
        <CoverMedia className="cover" src={template.cover} videoSrc={template.coverVideo} />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.72) 100%)',
            pointerEvents: 'none',
          }}
        />
        <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 10, left: 10 }}>
          {isVideoTemplate(template) && (
            <Chip
              icon={<Videocam sx={{ fontSize: '14px !important' }} />}
              label="Video"
              size="small"
              sx={{ bgcolor: GOLD, fontWeight: 800, fontSize: '0.65rem', height: 22 }}
            />
          )}
          <Chip
            label={template.tag}
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,0.92)', fontWeight: 700, fontSize: '0.65rem', height: 22 }}
          />
          <Chip
            label={template.duration}
            size="small"
            sx={{ bgcolor: 'rgba(0,0,0,0.45)', color: '#fff', fontWeight: 600, fontSize: '0.65rem', height: 22 }}
          />
        </Stack>
        <Typography
          sx={{
            position: 'absolute',
            left: 14,
            bottom: 12,
            right: 14,
            color: '#fff',
            fontWeight: 700,
            fontSize: '1.05rem',
            letterSpacing: '-0.03em',
            lineHeight: 1.2,
          }}
        >
          {template.title}
        </Typography>
      </Box>
      <Box sx={{ p: 1.75 }}>
        <Typography sx={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.45, minHeight: 44 }}>
          {template.description}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25, flexWrap: 'wrap', gap: 0.5 }}>
          {template.outputs.map((o) => (
            <Chip
              key={o}
              label={o}
              size="small"
              sx={{ height: 22, fontSize: '0.65rem', bgcolor: '#f4f4f4', fontWeight: 600 }}
            />
          ))}
        </Stack>
      </Box>
    </Paper>
  );
}

export default function AdCreativeElevenLabs() {
  const [params, setParams] = useSearchParams();
  const templateId = params.get('template');
  const template = templateId ? getAdCreativeTemplate(templateId) : null;

  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('en');
  const [voiceId, setVoiceId] = useState('');
  const [script, setScript] = useState('');
  const [files, setFiles] = useState({});
  const filesRef = useRef(files);
  filesRef.current = files;
  const [snack, setSnack] = useState({ open: false, msg: '', sev: 'info' });

  const langMeta = AD_CREATIVE_LANGUAGES.find((l) => l.value === language) || AD_CREATIVE_LANGUAGES[0];
  const voices = useMemo(() => voicesForLang(langMeta.voiceLang), [langMeta.voiceLang]);

  useEffect(() => {
    if (!voices.length) return;
    if (!voices.some((v) => v.id === voiceId)) {
      setVoiceId(voices[0].id);
    }
  }, [voices, voiceId]);

  useEffect(() => {
    if (template) setScript(template.scriptHint || '');
  }, [template]);

  useEffect(() => {
    return () => {
      Object.values(filesRef.current).forEach((entry) => {
        if (entry?.url) URL.revokeObjectURL(entry.url);
      });
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AD_CREATIVE_TEMPLATES.filter((t) => {
      if (category === 'short-video' && t.kind !== 'video') return false;
      if (category !== 'all' && category !== 'short-video' && t.category !== category) return false;
      if (!q) return true;
      return `${t.title} ${t.description} ${t.tag} video`.toLowerCase().includes(q);
    });
  }, [category, query]);

  const openTemplate = (id) => {
    setFiles({});
    setParams({ template: id });
  };

  const closeTemplate = () => {
    Object.values(files).forEach((entry) => {
      if (entry?.url) URL.revokeObjectURL(entry.url);
    });
    setFiles({});
    setParams({});
  };

  const onPick = useCallback((slotId, file) => {
    setFiles((prev) => {
      if (prev[slotId]?.url) URL.revokeObjectURL(prev[slotId].url);
      return { ...prev, [slotId]: { file, url: URL.createObjectURL(file) } };
    });
  }, []);

  const onClear = useCallback((slotId) => {
    setFiles((prev) => {
      if (prev[slotId]?.url) URL.revokeObjectURL(prev[slotId].url);
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }, []);

  const selectedVoice = voices.find((v) => v.id === voiceId);
  const filledSlots = template ? template.slots.filter((s) => files[s.id]).length : 0;
  const firstSlot = template ? files[template.slots[0]?.id] : null;
  const heroVideoSrc = firstSlot
    ? (isVideoFile(firstSlot.file) ? firstSlot.url : null)
    : template?.coverVideo;
  const heroImageSrc = firstSlot && !isVideoFile(firstSlot.file) ? firstSlot.url : template?.cover;

  const handleGenerate = () => {
    if (!template) return;
    if (filledSlots < 1) {
      setSnack({
        open: true,
        msg: isVideoTemplate(template)
          ? 'Add at least one short video clip to customize this template.'
          : 'Add at least one image to customize this template.',
        sev: 'warning',
      });
      return;
    }
    setSnack({
      open: true,
      msg: 'Layout saved in this session. Ad generation is not connected yet — no backend run.',
      sev: 'info',
    });
  };

  if (template) {
    return (
      <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={closeTemplate}
          sx={{ textTransform: 'none', color: '#555', fontWeight: 600, mb: 2, ml: -1 }}
        >
          All templates
        </Button>

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: '1px solid #ececec',
                bgcolor: '#0c0c0c',
              }}
            >
              <Box sx={{ position: 'relative', aspectRatio: { xs: '4/5', md: '4/3' } }}>
                <CoverMedia
                  src={heroImageSrc}
                  videoSrc={heroVideoSrc}
                  sx={{ opacity: 0.92 }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
                    pointerEvents: 'none',
                  }}
                />
                <Stack sx={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
                  <Typography sx={{ color: GOLD, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em' }}>
                    {isVideoTemplate(template) ? 'SHORT VIDEO · ' : ''}
                    {template.tag.toUpperCase()} · {template.aspect} · {template.duration}
                  </Typography>
                  <Typography sx={{ color: '#fff', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.04em', mt: 0.5 }}>
                    {template.title}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 0.75, maxWidth: 480 }}>
                    {script || template.description}
                  </Typography>
                </Stack>
              </Box>
            </Paper>
            <Typography sx={{ mt: 1.5, fontSize: '0.8rem', color: '#888' }}>
              {isVideoTemplate(template)
                ? 'Preview loops the stock clip until you upload your own short video. Generation will be wired later.'
                : 'Preview uses your first uploaded still when present. Generation will be wired later.'}
            </Typography>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '20px', border: '1px solid #ececec', bgcolor: '#fff' }}>
              <Typography sx={{ fontWeight: 800, letterSpacing: '-0.03em', mb: 0.5 }}>Customize</Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#777', mb: 2.5 }}>{template.description}</Typography>

              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#999', letterSpacing: '0.08em', mb: 1.25 }}>
                IMAGES
              </Typography>
              <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
                {template.slots.map((slot) => (
                  <Grid item xs={12} sm={6} md={12} lg={6} key={slot.id}>
                    <SlotDrop
                      slot={slot}
                      file={files[slot.id]?.file}
                      previewUrl={files[slot.id]?.url}
                      onPick={onPick}
                      onClear={onClear}
                    />
                  </Grid>
                ))}
              </Grid>

              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                    <LanguageIcon sx={{ fontSize: 16, color: '#888' }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#999', letterSpacing: '0.08em' }}>
                      LANGUAGE
                    </Typography>
                  </Stack>
                  <Select
                    fullWidth
                    size="small"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    sx={{ borderRadius: '12px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e8e8e8' } }}
                  >
                    {AD_CREATIVE_LANGUAGES.map((l) => (
                      <MenuItem key={l.value} value={l.value}>
                        {l.label}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>

                <Box>
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                    <RecordVoiceOver sx={{ fontSize: 16, color: '#888' }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#999', letterSpacing: '0.08em' }}>
                      VOICE
                    </Typography>
                  </Stack>
                  <Stack spacing={1} sx={{ maxHeight: 220, overflowY: 'auto', pr: 0.5 }}>
                    {voices.map((v) => {
                      const active = v.id === voiceId;
                      return (
                        <Paper
                          key={v.id}
                          elevation={0}
                          onClick={() => setVoiceId(v.id)}
                          sx={{
                            p: 1.25,
                            borderRadius: '12px',
                            border: active ? `1.5px solid ${GOLD}` : '1px solid #eee',
                            bgcolor: active ? 'rgba(232,160,32,0.06)' : '#fff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                          }}
                        >
                          <Avatar sx={{ width: 36, height: 36, bgcolor: v.color, fontSize: '0.85rem', fontWeight: 700 }}>
                            {v.name[0]}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{v.name}</Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#888' }} noWrap>
                              {v.persona}
                            </Typography>
                          </Box>
                          {active && <CheckCircle sx={{ fontSize: 18, color: GOLD_DARK }} />}
                        </Paper>
                      );
                    })}
                  </Stack>
                </Box>

                <TextField
                  label="Script / tagline"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleGenerate}
                  sx={{
                    py: 1.35,
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#111',
                    '&:hover': { bgcolor: '#000' },
                  }}
                >
                  Generate ad
                </Button>
                <Typography sx={{ fontSize: '0.72rem', color: '#999', textAlign: 'center' }}>
                  {filledSlots}/{template.slots.length} images · {selectedVoice?.name || 'Voice'} · {langMeta.label}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={snack.open}
          autoHideDuration={4200}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snack.sev} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1180, mx: 'auto', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3.5 } }}>
      <StudioHeroBanner
        image={STUDIO_VISUALS.ads.image}
        title="Ad Creative"
        subtitle="Pick a recipe, drop in stills or a short clip, choose a voice"
        height={176}
      />
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="flex-end" alignItems={{ md: 'center' }} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1.5,
            py: 0.75,
            borderRadius: '12px',
            border: '1px solid #e8e8e8',
            minWidth: { xs: '100%', md: 280 },
          }}
        >
          <Search sx={{ color: '#999', mr: 1 }} fontSize="small" />
          <InputBase
            placeholder="Search templates"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ flex: 1, fontSize: '0.9rem' }}
          />
        </Paper>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ mb: 3, flexWrap: { xs: 'nowrap', md: 'wrap' }, gap: 1, overflowX: { xs: 'auto', md: 'visible' }, pb: 0.5 }}
      >
        {AD_CREATIVE_CATEGORIES.map((c) => {
          const active = category === c.id;
          const count = countTemplatesInCategory(c.id);
          return (
            <Chip
              key={c.id}
              label={`${c.label} (${count})`}
              onClick={() => setCategory(c.id)}
              sx={{
                fontWeight: 700,
                bgcolor: active ? '#111' : '#fff',
                color: active ? '#fff' : '#333',
                border: active ? 'none' : '1px solid #e6e6e6',
                flexShrink: 0,
                '&:hover': { bgcolor: active ? '#000' : '#f6f6f6' },
              }}
            />
          );
        })}
      </Stack>

      {filtered.length === 0 ? (
        <Typography sx={{ color: '#888', py: 8, textAlign: 'center' }}>No templates match that search.</Typography>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((t) => (
            <Grid item xs={12} sm={6} lg={4} key={t.id}>
              <TemplateCard template={t} onOpen={openTemplate} />
            </Grid>
          ))}
        </Grid>
      )}

      <Typography sx={{ mt: 4, fontSize: '0.75rem', color: '#aaa', textAlign: 'center' }}>
        Recipes inspired by ElevenCreative (lookbook, outfit swap, device mockup, product stills). Covers from Unsplash.
      </Typography>
    </Box>
  );
}
