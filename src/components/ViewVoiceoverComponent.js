import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Stack, Chip, IconButton, Tooltip } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { useNavigate } from 'react-router-dom';
import { dataAPI } from '../services/api';
import useExportGate from '../hooks/useExportGate';
import {
  ResultViewLayout, ResultSection, rvPrimaryButtonSx, RV_AC,
  ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import MediaTrimEditor from './MediaTrimEditor';

const ViewVoiceoverComponent = ({ voiceoverId }) => {
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { balance, lowCredits, exportBlockedTitle, downloadUrl, ensureCredits } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let found = null;
        try {
          const data = await dataAPI.getVoiceover(voiceoverId);
          found = data?.entry || null;
        } catch {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const uid = user.uid || user.userId;
          const list = await dataAPI.getVoiceovers(uid);
          found = (list?.entries || []).find(e => e.doc_id === voiceoverId) || null;
        }
        if (active) setEntry(found);
      } catch {
        if (active) notify('Failed to load voiceover project', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [voiceoverId, notify]);

  const videoUrl = entry?.narration_video_url || entry?.slideshow_url || (entry?.type === 'video_narration' ? entry?.video_url : null);
  const mixUrl = entry?.combined_audio_url && entry.combined_audio_url !== entry?.slideshow_url ? entry.combined_audio_url : null;
  const segments = Array.isArray(entry?.segments) ? entry.segments : [];
  const typeLabel = entry?.type === 'image_slideshow' ? 'Image Slideshow'
    : entry?.type === 'video_narration' ? 'Video Narration'
    : 'Narration';

  const download = async (url) => {
    if (!url) return;
    await downloadUrl(url, notify);
  };

  const primaryDownloadUrl = videoUrl || mixUrl || segments.find(s => s.audio_url)?.audio_url || null;

  return (
    <>
      <ResultViewLayout
        type="voiceover"
        title={entry?.title || 'Voiceover'}
        subtitle={typeLabel}
        date={entry?.date}
        onBack={() => navigate(-1)}
        loading={loading}
        empty={!loading && !entry}
        emptyMessage="Voiceover project not found"
        emptyIcon={GraphicEqIcon}
        badges={[
          entry?.status && { label: entry.status === 'completed' ? 'Completed' : entry.status },
          entry?.total_blocks != null && { label: `${entry.successful ?? segments.length}/${entry.total_blocks} blocks` },
          entry?.bgm_track && { label: 'With music' },
          entry?.credits_used != null && { label: `${Number(entry.credits_used).toFixed(1)} credits used` },
        ].filter(Boolean)}
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
            <ResultShareBar
              title={entry?.title || 'Voiceover'}
              text={`Listen to my voiceover: ${entry?.title || 'Voiceover project'}`}
              onNotify={notify}
              compact
            />
            {primaryDownloadUrl && (
              <Tooltip title={!lowCredits ? 'Download output' : exportBlockedTitle}>
                <span>
                  <Button
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => download(primaryDownloadUrl)}
                    disabled={lowCredits}
                    sx={rvPrimaryButtonSx}
                  >
                    Download
                  </Button>
                </span>
              </Tooltip>
            )}
          </Stack>
        }
      >
        {videoUrl && (
          <ResultSection title="Video — trim & export" defaultExpanded collapsible>
            <MediaTrimEditor
              url={videoUrl}
              video
              filename={`${(entry?.title || 'voiceover').replace(/\s+/g, '_')}_video_trim`}
              onNotify={notify}
              ensureExport={ensureCredits}
            />
          </ResultSection>
        )}

        {mixUrl && (
          <ResultSection title="Final mixed narration — trim" defaultExpanded={false} collapsible>
            <MediaTrimEditor
              url={mixUrl}
              filename={`${(entry?.title || 'voiceover').replace(/\s+/g, '_')}_mix_trim`}
              onNotify={notify}
              ensureExport={ensureCredits}
            />
          </ResultSection>
        )}

        {segments.length > 0 && (
          <ResultSection title="Script Blocks" defaultExpanded collapsible>
            <Stack spacing={1.25}>
              {segments.map((seg, i) => {
                const failed = seg.status && seg.status !== 'ok';
                return (
                  <Box key={i} sx={{ p: 1.75, borderRadius: '12px', background: failed ? 'rgba(239,68,68,0.04)' : 'rgba(17,17,17,0.025)', border: `1px solid ${failed ? 'rgba(239,68,68,0.18)' : 'rgba(17,17,17,0.06)'}` }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.75 }}>
                      <Chip size="small" label={`#${i + 1}`} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(232,160,32,0.1)', color: RV_AC }} />
                      {seg.language && <Chip size="small" label={String(seg.language).toUpperCase()} sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, bgcolor: 'rgba(17,17,17,0.05)', color: 'rgba(17,17,17,0.6)' }} />}
                      {failed && <Chip size="small" label="Failed" sx={{ height: 20, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(239,68,68,0.12)', color: '#ef4444' }} />}
                      {seg.audio_url && (
                        <Stack direction="row" spacing={0.5} sx={{ ml: 'auto' }}>
                          <Tooltip title="Preview">
                            <IconButton size="small" onClick={() => new Audio(seg.audio_url).play()} sx={{ background: 'rgba(232,160,32,0.12)', color: RV_AC, p: 0.5 }}>
                              <PlayArrowIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={!lowCredits ? 'Download block' : exportBlockedTitle}>
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => download(seg.audio_url)}
                                disabled={lowCredits}
                                sx={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', p: 0.5 }}
                              >
                                <CloudDownloadIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                    {seg.text && <Typography sx={{ fontSize: '0.85rem', color: '#111111', mb: seg.audio_url ? 1.5 : 0 }}>{seg.text}</Typography>}
                    {seg.audio_url && (
                      <MediaTrimEditor
                        url={seg.audio_url}
                        filename={`${(entry?.title || 'voiceover').replace(/\s+/g, '_')}_block_${i + 1}`}
                        onNotify={notify}
                        ensureExport={ensureCredits}
                        height={64}
                      />
                    )}
                  </Box>
                );
              })}
            </Stack>
          </ResultSection>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewVoiceoverComponent;
