import { useEffect, useState, useRef, useCallback } from 'react';
import { Box, Typography, Slider, Stack } from '@mui/material';
import { PlayArrow, Stop, Save } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { SettingSelect, SettingToggle, SettingSection, ElevenLabsButton } from '../ElevenLabsUI';
import { soundtracksAPI, getFriendlyErrorMessage } from '../../services/api';

/** Load soundtrack catalog and expose picker state for studio pages. */
export function useSoundtrackPicker(initialVolume = 0.12) {
  const location = useLocation();
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [bgmTracks, setBgmTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [selectedBgm, setSelectedBgm] = useState('');
  const [bgmVolume, setBgmVolume] = useState(initialVolume);
  const [dryVolume, setDryVolume] = useState(1);
  const [applying, setApplying] = useState(false);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    setTracksLoading(true);
    soundtracksAPI
      .getTracks()
      .then((data) => {
        const tracks = data?.tracks?.length ? data.tracks : [];
        setBgmTracks(tracks);
        const fromNav = location.state?.bgmTrackId;
        if (fromNav && tracks.some((t) => t.id === fromNav)) {
          setSelectedBgm(fromNav);
          setBgmEnabled(true);
        } else if (tracks[0] && !selectedBgm) {
          setSelectedBgm(tracks[0].id);
        }
      })
      .catch(() => setBgmTracks([]))
      .finally(() => setTracksLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.bgmTrackId]);

  return {
    bgmEnabled,
    setBgmEnabled,
    bgmTracks,
    tracksLoading,
    selectedBgm,
    setSelectedBgm,
    bgmVolume,
    setBgmVolume,
    dryVolume,
    setDryVolume,
    applying,
    setApplying,
    previewing,
    setPreviewing,
    bgmTrack: bgmEnabled && selectedBgm ? selectedBgm : null,
  };
}

function notifyPreviewError(message) {
  window.dispatchEvent(
    new CustomEvent('app-notification', {
      detail: { type: 'error', message },
    })
  );
}

export default function SoundtrackPickerSection({
  bgmEnabled,
  setBgmEnabled,
  bgmTracks,
  tracksLoading = false,
  selectedBgm,
  setSelectedBgm,
  bgmVolume,
  setBgmVolume,
  dryVolume = 1,
  setDryVolume,
  applying,
  setApplying,
  previewing,
  setPreviewing,
  dryAudioUrl,
  docId,
  source,
  lang,
  userId,
  onApplied,
  applyLabel = 'Save with soundtrack',
}) {
  const navigate = useNavigate();
  const previewRef = useRef(null);
  const dryVolumeRef = useRef(dryVolume);
  const bgmVolumeRef = useRef(bgmVolume);

  useEffect(() => {
    dryVolumeRef.current = dryVolume;
  }, [dryVolume]);

  useEffect(() => {
    bgmVolumeRef.current = bgmVolume;
  }, [bgmVolume]);

  const selectedTrack = bgmTracks.find((t) => t.id === selectedBgm);
  const bgmPreviewUrl = selectedTrack?.preview_url || selectedTrack?.url;

  const isVideoDry = Boolean(dryAudioUrl && /\.(mp4|webm|mov)(\?|$)/i.test(dryAudioUrl));

  const canPreview = Boolean(dryAudioUrl && bgmEnabled && bgmPreviewUrl);
  const canApply = Boolean(docId && userId && source && onApplied && dryAudioUrl);

  const stopPreview = useCallback(() => {
    const state = previewRef.current;
    if (state) {
      try {
        state.dryEl?.pause();
        state.bgmEl?.pause();
        if (state.isVideo) {
          state.dryEl.removeAttribute('src');
          state.dryEl.load();
        } else {
          state.dryEl.src = '';
          state.bgmEl.src = '';
          state.dryEl.load();
          state.bgmEl.load();
        }
      } catch {
        /* ignore */
      }
    }
    previewRef.current = null;
    setPreviewing(false);
  }, [setPreviewing]);

  const startPreview = useCallback(async () => {
    if (!dryAudioUrl || !bgmEnabled || !bgmPreviewUrl) return;
    stopPreview();

    const bgmEl = new Audio(bgmPreviewUrl);
    bgmEl.preload = 'auto';
    bgmEl.volume = Math.min(1, Math.max(0, bgmVolumeRef.current));
    bgmEl.loop = true;

    let dryEl;
    if (isVideoDry) {
      dryEl = document.createElement('video');
      dryEl.src = dryAudioUrl;
      dryEl.playsInline = true;
      dryEl.volume = Math.min(1, Math.max(0, dryVolumeRef.current));
      dryEl.onended = () => stopPreview();
    } else {
      dryEl = new Audio(dryAudioUrl);
      dryEl.preload = 'auto';
      dryEl.volume = Math.min(1, Math.max(0, dryVolumeRef.current));
      dryEl.onended = () => stopPreview();
    }

    previewRef.current = { dryEl, bgmEl, isVideo: isVideoDry };

    try {
      await Promise.all([dryEl.play(), bgmEl.play()]);
      setPreviewing(true);
    } catch {
      stopPreview();
      notifyPreviewError('Could not play preview. Check your media URLs or try again.');
    }
  }, [dryAudioUrl, bgmEnabled, bgmPreviewUrl, isVideoDry, stopPreview, setPreviewing]);

  const startPreviewRef = useRef(startPreview);
  startPreviewRef.current = startPreview;

  useEffect(() => () => stopPreview(), [stopPreview]);

  // Live volume while preview is playing — no restart needed
  useEffect(() => {
    const state = previewRef.current;
    if (!state) return;
    state.dryEl.volume = Math.min(1, Math.max(0, dryVolume));
    state.bgmEl.volume = Math.min(1, Math.max(0, bgmVolume));
  }, [dryVolume, bgmVolume]);

  // Auto-start preview when mix is ready or track changes (not on volume tweaks)
  useEffect(() => {
    if (canPreview) {
      startPreviewRef.current();
    } else {
      stopPreview();
    }
  }, [canPreview, selectedBgm, dryAudioUrl, stopPreview]);

  const handlePreviewToggle = () => {
    if (previewing) stopPreview();
    else startPreview();
  };

  const handleApply = async () => {
    if (!docId || !userId || !source || !onApplied) return;
    setApplying(true);
    try {
      const res = await soundtracksAPI.applySoundtrack(docId, source, userId, {
        bgmTrack: bgmEnabled ? selectedBgm : null,
        bgmVolume,
        lang,
      });
      const url =
        res.audio_url ||
        res.combined_audio_url ||
        res.video_url ||
        res.dubbed_video_url ||
        dryAudioUrl;
      onApplied(url, res);
      stopPreview();
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent('app-notification', {
          detail: {
            type: 'error',
            message: getFriendlyErrorMessage(e, 'Failed to apply soundtrack'),
          },
        })
      );
    } finally {
      setApplying(false);
    }
  };

  if (tracksLoading) {
    return (
      <SettingSection title="Soundtrack">
        <Typography sx={{ fontSize: '0.8125rem', color: '#999', px: 0.5 }}>
          Loading soundtracks…
        </Typography>
      </SettingSection>
    );
  }

  if (!bgmTracks.length) {
    return (
      <SettingSection title="Soundtrack">
        <Typography sx={{ fontSize: '0.8125rem', color: '#999', px: 0.5, mb: 1 }}>
          Soundtracks are unavailable right now.
        </Typography>
        <Typography
          component="button"
          type="button"
          onClick={() => navigate('/dashboard/soundtracks')}
          sx={{
            fontSize: '0.75rem',
            color: '#E8A020',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            p: 0,
            textAlign: 'left',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          Browse soundtracks →
        </Typography>
      </SettingSection>
    );
  }

  return (
    <SettingSection title="Soundtrack">
      <SettingToggle
        label="Add soundtrack"
        checked={bgmEnabled}
        onChange={(e) => {
          setBgmEnabled(e.target.checked);
          if (!e.target.checked) stopPreview();
        }}
        description="Listen while you adjust volume, then save when it sounds right"
      />
      {bgmEnabled && (
        <>
          <SettingSelect
            label="Track"
            value={selectedBgm}
            onChange={(e) => setSelectedBgm(e.target.value)}
            options={bgmTracks.map((t) => ({
              value: t.id,
              label: `${t.name} (${t.mood})`,
            }))}
          />
          {dryAudioUrl && (
            <>
              <Box sx={{ px: 1, py: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                  Speech volume — {Math.round(dryVolume * 100)}%
                </Typography>
                <Slider
                  value={dryVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(_, value) => setDryVolume(value)}
                  sx={{ color: '#1a1a1a', height: 4 }}
                />
              </Box>
              <Box sx={{ px: 1, py: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#666', mb: 0.5 }}>
                  Music volume — {Math.round(bgmVolume * 100)}%
                  {previewing ? ' · playing' : ''}
                </Typography>
                <Slider
                  value={bgmVolume}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(_, value) => setBgmVolume(value)}
                  sx={{ color: '#E8A020', height: 4 }}
                />
                <Typography sx={{ fontSize: '0.7rem', color: '#999', mt: 0.5 }}>
                  Drag sliders to hear the mix update in real time
                </Typography>
              </Box>
            </>
          )}
          {canPreview && (
            <Stack direction="row" spacing={1} sx={{ px: 0.5, pb: 0.5 }}>
              <ElevenLabsButton
                variant="outlined"
                size="small"
                startIcon={previewing ? <Stop /> : <PlayArrow />}
                onClick={handlePreviewToggle}
              >
                {previewing ? 'Stop listening' : 'Listen again'}
              </ElevenLabsButton>
            </Stack>
          )}
          {canApply && (
            <Box sx={{ px: 0.5, pb: 0.5 }}>
              <ElevenLabsButton
                variant="contained"
                size="small"
                fullWidth
                loading={applying}
                startIcon={<Save />}
                onClick={handleApply}
              >
                {applyLabel}
              </ElevenLabsButton>
              <Typography sx={{ fontSize: '0.7rem', color: '#999', mt: 0.75 }}>
                Saves over the same file — no duplicate storage
              </Typography>
            </Box>
          )}
          {!dryAudioUrl && (
            <Typography sx={{ fontSize: '0.75rem', color: '#999', px: 0.5 }}>
              Generate your {source === 'slideshow' || source === 'dubbing' ? 'video' : 'audio'} first, then adjust volume while listening.
            </Typography>
          )}
          <Box sx={{ px: 0.5 }}>
            <Typography
              component="button"
              type="button"
              onClick={() => navigate('/dashboard/soundtracks')}
              sx={{
                fontSize: '0.75rem',
                color: '#E8A020',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                p: 0,
                textAlign: 'left',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Browse all soundtracks →
            </Typography>
          </Box>
        </>
      )}
    </SettingSection>
  );
}
