import React, { useEffect, useState } from 'react';
import { Button, Stack, Tooltip } from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import MovieIcon from '@mui/icons-material/Movie';
import { useNavigate } from 'react-router-dom';
import { dataAPI, studioPlaybackUrl } from '../services/api';
import useExportGate from '../hooks/useExportGate';
import {
  ResultViewLayout, ResultSection, rvPrimaryButtonSx,
  ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import MediaTrimEditor from './MediaTrimEditor';

const ViewDubbingComponent = ({ dubbingId }) => {
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
          const data = await dataAPI.getDubbedVideo(dubbingId);
          found = data?.entry || null;
        } catch {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const uid = user.uid || user.userId;
          const list = await dataAPI.getDubbedVideos(uid);
          found = (list?.entries || []).find(e => e.doc_id === dubbingId) || null;
        }
        if (active) setEntry(found);
      } catch {
        if (active) notify('Failed to load dubbing project', 'error');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [dubbingId, notify]);

  const videoUrl =
    (entry?.playback_url?.startsWith('http') ? entry.playback_url : null)
    || studioPlaybackUrl('dubbing', dubbingId)
    || entry?.dubbed_video_url
    || entry?.slideshow_url
    || entry?.video_url
    || null;
  const isSlideshow = entry?.type === 'image_slideshow';
  const segments = Array.isArray(entry?.segments) ? entry.segments : [];
  const timelineSegments = segments.map(s => ({
    start: (s.start_time_ms != null ? s.start_time_ms / 1000 : s.start_time) || 0,
    end: (s.end_time_ms != null ? s.end_time_ms / 1000 : s.end_time) || 0,
    text: s.text || s.translated || '',
  }));

  const handleDownload = async () => {
    if (!videoUrl) return;
    await downloadUrl(videoUrl, notify);
  };

  return (
    <>
      <ResultViewLayout
        type="dubbing"
        title={entry?.title || entry?.video_filename || 'Video Dubbing'}
        subtitle={isSlideshow ? 'Image Slideshow' : 'Video Dubbing'}
        date={entry?.date}
        onBack={() => navigate(-1)}
        loading={loading}
        empty={!loading && !entry}
        emptyMessage="Dubbing project not found"
        emptyIcon={MovieIcon}
        badges={[
          entry?.status && { label: entry.status === 'completed' ? 'Completed' : entry.status },
          segments.length && { label: `${segments.length} segments` },
          entry?.credits_used != null && { label: `${Number(entry.credits_used).toFixed(1)} credits used` },
        ].filter(Boolean)}
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
            <ResultShareBar
              title={entry?.title || entry?.video_filename || 'Video Dubbing'}
              text={`Check out my dubbed video: ${entry?.title || 'Video Dubbing'}`}
              onNotify={notify}
              compact
            />
            {videoUrl && (
              <Tooltip title={!lowCredits ? 'Download dubbed video' : exportBlockedTitle}>
                <span>
                  <Button
                    startIcon={<CloudDownloadIcon />}
                    onClick={handleDownload}
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
          <ResultSection title="Output, timeline & trim" defaultExpanded collapsible>
            <MediaTrimEditor
              url={videoUrl}
              video
              filename={`${(entry?.title || entry?.video_filename || 'dubbing').replace(/\s+/g, '_')}_trim`}
              onNotify={notify}
              ensureExport={ensureCredits}
              segments={timelineSegments}
              emptyLabel="No timed segments for this project."
            />
          </ResultSection>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewDubbingComponent;
