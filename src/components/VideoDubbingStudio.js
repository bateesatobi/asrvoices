import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, TextField, IconButton, Stack,
  Grid, Chip, Fade, Alert, Avatar, InputBase, Slider,
  Tooltip, FormControl, Select, MenuItem, InputLabel,
  Divider, Stepper, Step, StepLabel, StepContent, Paper
} from '@mui/material';
import {
  CloudUpload,
  AutoAwesome,
  NotificationsActive as NotificationsActiveIcon,
  Download,
  CheckCircle,
  ClosedCaption,
  Search,
  Male, Female,
  RecordVoiceOver,
  Translate as TranslateIcon,
  Close as CloseIcon,
  GraphicEq,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentVeryDissatisfied,
  ElectricBolt,
  Psychology,
  VolumeDown,
  ContentCut,
  ChecklistRtl,
  PlayCircle,
  ContentCopy,
  CheckCircleOutline,
  Face,
  Face3,
  Face4,
  Face5,
  Face6,
} from '@mui/icons-material';
import { videoAPI, subscriptionAPI, translationAPI, getFriendlyErrorMessage, BASE_URL } from '../services/api';
import { NEURAL_LANGUAGES, NEURAL_SPEAKERS, NEURAL_LANGUAGE_MAP } from '../constants/neural_config';
import { AC, G, GLASS, STEPPER_SX } from '../utils/mediaVault';
import CreditEstimateChip from './CreditEstimateChip';
import { consumePipeline } from '../utils/pipelineHandoff';
import { useStudioTour } from './onboarding';
import { TOUR_IDS, dubbingTour } from './onboarding/tours';
import { AvoicesBackdropLoader } from './progress';

/* ─── Segment emotion presets ────────────────────────────────────────────── */
const EMOTIONS = [
  { id: 'neutral',       label: 'Neutral',  icon: <SentimentNeutral sx={{ fontSize: 13 }} />,         color: '#94a3b8' },
  { id: 'excited',       label: 'Excited',  icon: <ElectricBolt sx={{ fontSize: 13 }} />,              color: AC },
  { id: 'calm',          label: 'Calm',     icon: <SentimentSatisfied sx={{ fontSize: 13 }} />,        color: '#10b981' },
  { id: 'serious',       label: 'Serious',  icon: <Psychology sx={{ fontSize: 13 }} />,                color: '#E8A020' },
  { id: 'sad',           label: 'Sad',      icon: <SentimentVeryDissatisfied sx={{ fontSize: 13 }} />, color: '#C47F10' },
];

/* ─── EQ bars ────────────────────────────────────────────────────────────── */
const EQ_ANIM = `
  @keyframes dub_eq0 { 0%,100%{height:3px} 50%{height:14px} }
  @keyframes dub_eq1 { 0%,100%{height:10px} 50%{height:4px} }
  @keyframes dub_eq2 { 0%,100%{height:6px} 50%{height:16px} }
  @keyframes dub_eq3 { 0%,100%{height:14px} 50%{height:5px} }
  @keyframes dub_eq4 { 0%,100%{height:4px} 50%{height:12px} }
  @keyframes dub_eq5 { 0%,100%{height:9px} 50%{height:3px} }
`;
function EqBars({ active, color = AC }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 16, flexShrink: 0 }}>
      <style>{EQ_ANIM}</style>
      {[0,1,2,3,4,5].map(i => (
        <Box key={i} sx={{
          width: 2.5, height: active ? [3,10,6,14,4,9][i] : 3, borderRadius: '2px',
          background: active ? color : 'rgba(17, 17, 17, 0.15)',
          animation: active ? `dub_eq${i} ${0.55 + i * 0.08}s ease-in-out infinite` : 'none',
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

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function VideoDubbingStudio({ userId }) {
  useStudioTour(TOUR_IDS.dubbing, dubbingTour);
  const [activeStep, setActiveStep]           = useState(0);

  const [globalSpeaker, setGlobalSpeaker]     = useState(NEURAL_SPEAKERS[0]);
  const [videoFile, setVideoFile]             = useState(null);
  const [videoUrl, setVideoUrl]               = useState(null);
  const [videoDuration, setVideoDuration]     = useState(0);
  const [sourceLang, setSourceLang]           = useState('en');
  const [targetLang, setTargetLang]           = useState(NEURAL_SPEAKERS[0].lang);
  
  const [loading, setLoading]                 = useState(false);
  const [exporting, setExporting]             = useState(false);
  const [dubJobProgress, setDubJobProgress]   = useState({ status: '', progress: 0, message: '' });
  const [error, setError]                     = useState(null);
  const [pipelineHint, setPipelineHint]       = useState(null);
  const [docId, setDocId]                     = useState(null);
  const [sourceVideoUrl, setSourceVideoUrl]   = useState(null);
  const [segments, setSegments]               = useState([]);
  const [finalMasterUrl, setFinalMasterUrl]   = useState(null);
  const [successMsg, setSuccessMsg]           = useState(null);
  const [linkCopied, setLinkCopied]           = useState(false);
  
  const navigate = useNavigate();
  const [userBalance, setUserBalance]         = useState(0);
  const [trimRange, setTrimRange]             = useState([0, 100]);
  const [burnSubtitles, setBurnSubtitles]     = useState(false);
  const [focusedSegmentIndex, setFocusedSegmentIndex] = useState(0);

  const videoRef = useRef(null);
  const dubPollRef = useRef(null);

  const stopDubPoll = () => {
    if (dubPollRef.current) {
      clearInterval(dubPollRef.current);
      dubPollRef.current = null;
    }
  };

  useEffect(() => () => stopDubPoll(), []);

  const pollDubbingJob = (jobId) => {
    stopDubPoll();
    let attempts = 0;
    dubPollRef.current = setInterval(async () => {
      try {
        const job = await videoAPI.getJobStatus(jobId);
        const progress = Number.isFinite(job?.progress) ? job.progress : 0;
        setDubJobProgress({
          status: job?.status || 'processing',
          progress,
          message: job?.progress_message || '',
        });
        if (job?.status === 'completed' && job?.result?.dubbed_video_url) {
          setFinalMasterUrl(job.result.dubbed_video_url);
          setSuccessMsg('Dubbing completed successfully!');
          setActiveStep(4);
          setExporting(false);
          window.dispatchEvent(new CustomEvent('library-updated'));
          stopDubPoll();
          return;
        }
        if (job?.status === 'error' || job?.status === 'failed') {
          setError(job?.error || 'Dubbing failed');
          setExporting(false);
          stopDubPoll();
        }
      } catch (err) {
        if (err?.response?.status === 404) {
          setError('Dubbing job was lost (server restarted). Please try again.');
          setExporting(false);
          stopDubPoll();
        }
      }
      attempts += 1;
      if (attempts > 240) {
        setError('Dubbing is taking too long. Check Media Vault or retry.');
        setExporting(false);
        stopDubPoll();
      }
    }, 2500);
  };

  useEffect(() => {
    if (userId && subscriptionAPI.getBalance) {
      subscriptionAPI.getBalance(userId)
        .then(d => setUserBalance(d.balance ?? d.credit_balance ?? 0))
        .catch(() => {});
    }
  }, [userId]);

  useEffect(() => {
    const handoff = consumePipeline('dubbing');
    if (!handoff) return;
    const lang = handoff.targetLang || handoff.sourceLang;
    if (lang && NEURAL_SPEAKERS.some(s => s.lang === lang)) setTargetLang(lang);
    setPipelineHint('Target language set from your previous step. Upload the video you want to dub to continue.');
  }, []);

  const handleGlobalVoiceSelect = (s) => {
    setGlobalSpeaker(s);
    // Don't override targetLang - it should come from Step 2 translation selection
    // The speaker's language should match the target language
    
    // Also update all existing segments to use this voice
    setSegments(prev => prev.map(seg => ({ ...seg, voice: s.id })));
  };

  const handleTranslateSegments = async () => {
    if (!userId || segments.length === 0) {
      setError("Missing required information for translation.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = segments.map((seg, i) => ({
        item_id: String(i),
        segment_index: i,
        text: seg.text,
        start_time: seg.start_time,
        end_time: seg.end_time,
      }));
      const response = await translationAPI.translateBatch(
        payload,
        sourceLang,
        [targetLang],
        userId,
      );
      const byId = Object.fromEntries(
        (response.segments || []).map((s) => [String(s.item_id), s.translated || s.text]),
      );
      const translatedSegments = segments.map((seg, i) => ({
        ...seg,
        translated: byId[String(i)] || seg.text,
      }));

      setSegments(translatedSegments);
      setSuccessMsg("Translation completed successfully! Review the translations below.");
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Translation failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = file => {
    if (!file) return;
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    const vid = document.createElement('video');
    vid.preload = 'metadata';
    vid.onloadedmetadata = () => {
      setVideoDuration(vid.duration);
      setTrimRange([0, vid.duration]);
    };
    vid.src = url;
  };

  const loadDemoVideo = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://res.cloudinary.com/demo/video/upload/dog.mp4');
      const blob = await response.blob();
      const file = new File([blob], 'demo_video.mp4', { type: 'video/mp4' });
      handleVideoUpload(file);
    } catch (e) {
      setError("Failed to load demo video.");
    } finally {
      setLoading(false);
    }
  };

  const processSource = async () => {
    if (!videoFile) {
        setError("Please upload a video first.");
        return;
    }
    setLoading(true); setError(null);
    try {
      const res = await videoAPI.extractAudioFromVideo(videoFile, sourceLang, userId);
      
      // Check if response is async (has job_id) or sync (has doc_id)
      if (res.job_id) {
        // New async flow - poll for job completion
        await pollJobCompletion(res.job_id);
      } else if (res.doc_id) {
        // Old sync flow - backward compatibility
        setDocId(res.doc_id);
        pollSegments(res.doc_id);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to process video. Please try again.'));
      setLoading(false);
    }
  };

  const pollJobCompletion = async (jobId) => {
    const maxWaitMs = 30 * 60 * 1000; // 30 minutes for async jobs
    const startedAt = Date.now();

    const itv = setInterval(async () => {
      if (Date.now() - startedAt > maxWaitMs) {
        clearInterval(itv);
        setLoading(false);
        setError('Processing timed out. Please try again with a shorter video or contact support.');
        return;
      }
      
      try {
        // Poll job status
        const response = await fetch(`${BASE_URL}/api/jobs/${jobId}?user_id=${userId}`);
        
        if (!response.ok) {
          throw new Error(`Job status check failed: ${response.status}`);
        }
        
        const jobData = await response.json();
        
        if (jobData.status === 'completed') {
          clearInterval(itv);
          const docId = jobData.result?.doc_id;
          
          if (!docId) {
            throw new Error('Job completed but no doc_id returned');
          }
          
          if (jobData.result?.video_url) {
            setSourceVideoUrl(jobData.result.video_url);
          }
          setDocId(docId);
          pollSegments(docId);
        } else if (jobData.status === 'failed' || jobData.status === 'error') {
          clearInterval(itv);
          setLoading(false);
          setError(`Processing failed: ${jobData.error || 'Unknown error'}`);
        }
        // Otherwise keep polling (status is 'pending' or 'processing')
      } catch (err) {
        console.error('Job polling error:', err);
        // Don't stop polling on transient errors
      }
    }, 3000); // Poll every 3 seconds
  };

  const pollSegments = async did => {
    const maxWaitMs = 2 * 60 * 1000;
    const startedAt = Date.now();

    const itv = setInterval(async () => {
      if (Date.now() - startedAt > maxWaitMs) {
        clearInterval(itv);
        setLoading(false);
        setError('Processing timed out. Please try again.');
        return;
      }
      try {
        const data = await videoAPI.getVideo(did);
        const entries = data.entries || [];
        const entry = entries.find(e => e.doc_id === did) || entries[0];
        const transcriptions = entry?.timestamped_transcriptions;

        if (Array.isArray(transcriptions) && transcriptions.length > 0) {
          if (entry?.url) setSourceVideoUrl(entry.url);
          const segs = transcriptions.map(s => ({
            ...s, translated: '',
            voice: globalSpeaker.id,
            lang: targetLang,
            emotion: 'neutral',
          }));
          setSegments(segs);
          setFocusedSegmentIndex(0);
          setLoading(false);
          clearInterval(itv);
          setActiveStep(1); // Auto-advance to Step 2
        }
      } catch (e) {
        console.warn('[pollSegments] fetch error, will retry:', e?.message);
      }
    }, 3000);
  };

  const handleExportMaster = async (runInBackground = false) => {
    if (!docId || (!sourceVideoUrl && !videoFile)) return;
    setExporting(true);
    setDubJobProgress({ status: 'processing', progress: 0 });
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await videoAPI.finalizeDubbing(
        docId,
        segments.map((s, i) => ({
          segment_index: i, text: s.translated || s.text, target_lang: s.lang,
          speaker_id: s.voice, start_time_ms: (s.start_time || 0) * 1000, end_time_ms: (s.end_time || 0) * 1000,
        })),
        userId, sourceVideoUrl ? null : videoFile,
        { 
          videoDurationMins: videoDuration / 60, 
          originalVolume: 0,
          burnSubtitles, 
          trimStartMs: Math.round(trimRange[0] * 1000), 
          trimEndMs: Math.round(trimRange[1] * 1000),
          background: runInBackground,
          videoUrl: sourceVideoUrl || undefined,
        }
      );
      if (runInBackground) {
        if (res?.job_id) {
          setDubJobProgress({ status: 'starting', progress: 0 });
          pollDubbingJob(res.job_id);
          return;
        }
        window.dispatchEvent(new CustomEvent('app-notification', {
          detail: {
            type: 'success',
            title: 'Background Dubbing Started',
            message: "Dubbing is running. We'll email you when it's complete.",
          },
        }));
        setExporting(false);
        setTimeout(() => navigate('/dashboard/history'), 3000);
        return;
      }
      if (res?.job_id) {
        setDubJobProgress({ status: 'starting', progress: 0 });
        pollDubbingJob(res.job_id);
        return;
      }
      if (res.dubbed_video_url) {
        setFinalMasterUrl(res.dubbed_video_url);
        setSuccessMsg('Dubbing completed successfully!');
        setActiveStep(4);
        window.dispatchEvent(new CustomEvent('library-updated'));
      }
      setExporting(false);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Export failed. Please try again.'));
      setExporting(false);
    }
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);
  const handleReset = () => {
    setActiveStep(0);
    setVideoFile(null);
    setVideoUrl(null);
    setSegments([]);
    setFinalMasterUrl(null);
    setDocId(null);
  };

  const fmtDuration = secs => {
    if (!secs) return '0s';
    const m = Math.floor(secs / 60), s2 = Math.round(secs % 60);
    return m > 0 ? `${m}m ${s2}s` : `${s2}s`;
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, minHeight: '100vh', background: 'transparent', color: '#111111', maxWidth: 1200, mx: 'auto' }}>
      
      <AvoicesBackdropLoader
        open={loading || exporting}
        message={exporting ? 'Rendering master video…' : 'Processing audio & transcribing…'}
        submessage={
          exporting && (dubJobProgress.message || dubJobProgress.status)
            ? (dubJobProgress.message || {
                starting: 'Preparing dubbing job…',
                processing: 'Batch voice synthesis and muxing video…',
                synthesizing: 'Batch voice synthesis in progress…',
                mixing: 'Mixing dubbed audio…',
                rendering: 'Rendering dubbed video…',
                uploading: 'Uploading final video…',
                completed: 'Finalizing export…',
                error: 'Export failed',
              }[dubJobProgress.status] || `Status: ${dubJobProgress.status}`)
            : 'Extracting audio and generating transcript segments'
        }
        progress={exporting && dubJobProgress.progress > 0 ? dubJobProgress.progress : undefined}
      />

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: '12px', background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f87171' }}>{error}</Alert>}
      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2, borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }}>{successMsg}</Alert>}
      {pipelineHint && <Alert severity="info" onClose={() => setPipelineHint(null)} sx={{ mb: 2, borderRadius: '12px', background: 'rgba(232,160,32,0.08)', border: '1px solid rgba(232,160,32,0.25)', color: '#C47F10' }}>{pipelineHint}</Alert>}

      <Stepper data-tour="studio-flow" activeStep={activeStep} orientation="vertical" sx={STEPPER_SX}>
        
        {/* Step 1: Upload Video & Source Language */}
        <Step>
          <StepLabel>Step 1: Upload Video & Transcription</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 2, fontWeight: 600 }}>
                Upload the video you want to translate.
              </Typography>
              <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000', borderRadius: '16px', overflow: 'hidden', mb: 3 }}>
                {videoUrl ? (
                  <video ref={videoRef} src={videoUrl} controls style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
                ) : (
                  <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Box sx={{ width: 60, height: 60, borderRadius: '16px', background: 'rgba(232, 160, 32,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloudUpload sx={{ fontSize: 30, color: AC }} />
                    </Box>
                    <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                      <Button component="label" variant="contained" sx={{ background: G, borderRadius: '12px', px: 4, fontWeight: 900, boxShadow: '0 4px 20px rgba(232, 160, 32,0.25)', '&:hover': { transform: 'translateY(-1px)' } }}>
                        Upload Video
                        <input type="file" hidden accept="video/*" onChange={e => handleVideoUpload(e.target.files[0])} />
                      </Button>
                      <Button variant="outlined" onClick={loadDemoVideo} disabled={loading} sx={{ borderRadius: '12px', px: 4, fontWeight: 800, borderColor: 'rgba(232, 160, 32,0.4)', color: AC, '&:hover': { borderColor: AC, background: 'rgba(232, 160, 32,0.05)', transform: 'translateY(-1px)' } }}>
                        Try Demo
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
                <Box sx={{ flex: 1, maxWidth: 300 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 1, fontWeight: 600 }}>
                    What is the original language of the video?
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel sx={{ color: 'rgba(17, 17, 17,0.5)', '&.Mui-focused': { color: AC } }}>Source Language</InputLabel>
                    <Select value={sourceLang} label="Source Language" onChange={e => setSourceLang(e.target.value)}
                      sx={{ borderRadius: '12px', color: '#111111', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 17, 17, 0.15)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: AC } }}
                    >
                      {NEURAL_LANGUAGES.filter(l => l.code !== 'all').map(l => <MenuItem key={l.code} value={l.code}>{l.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                <Button variant="contained" onClick={processSource} disabled={!videoFile || loading} startIcon={<AutoAwesome />} sx={{ background: G, color: '#fff', py: 1.5, px: 4, borderRadius: '12px', fontWeight: 900, fontSize: '1rem', '&.Mui-disabled': { background: 'rgba(17,17,17,0.1)' } }}>
                  Extract Audio & Transcribe
                </Button>
              </Box>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button onClick={handleBack} sx={{ color: 'rgba(17,17,17,0.6)', fontWeight: 700 }}>Back</Button>
              </Box>
            </Paper>
          </StepContent>
        </Step>

        {/* Step 2: Review & Translate Transcript */}
        <Step>
          <StepLabel>Step 2: Review Transcript & Translate</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', fontWeight: 600 }}>
                    Review the extracted transcript. Click "Auto-Translate All" to generate translations for your target language ({NEURAL_LANGUAGES.find(l => l.code === targetLang)?.name}).
                  </Typography>
                  <Button variant="outlined" startIcon={<AutoAwesome />}
                    onClick={handleTranslateSegments}
                    disabled={loading || segments.length === 0}
                    sx={{ color: AC, borderColor: AC, fontWeight: 800, borderRadius: '8px' }}
                  >
                    {loading ? 'Translating…' : 'Auto-Translate All'}
                  </Button>
                </Stack>

                <Stack spacing={1.5} sx={{ maxHeight: '50vh', overflowY: 'auto', pr: 1 }}>
                  {segments.map((seg, i) => {
                    const segVoice = NEURAL_SPEAKERS.find(s => s.id === seg.voice);
                    const isFocused = focusedSegmentIndex === i;
                    const emotion = EMOTIONS.find(e => e.id === seg.emotion) || EMOTIONS[0];
                    return (
                      <Box key={i} onClick={() => setFocusedSegmentIndex(i)} sx={{
                        ...GLASS, p: 2, cursor: 'pointer',
                        border: isFocused ? `1.5px solid ${AC}` : '1px solid rgba(17, 17, 17, 0.05)',
                        background: isFocused ? 'rgba(232, 160, 32,0.04)' : 'rgba(17, 17, 17,0.015)',
                        transition: 'all 0.18s',
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
                          <Box sx={{ width: 20, height: 20, borderRadius: '5px', background: isFocused ? 'rgba(232, 160, 32,0.2)' : 'rgba(17, 17, 17, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.56rem', fontWeight: 900, color: isFocused ? AC : 'rgba(17, 17, 17,0.3)' }}>{String(i + 1).padStart(2, '0')}</Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.65rem', color: 'rgba(17, 17, 17, 0.4)', fontWeight: 700 }}>
                            {seg.start_time?.toFixed(1)}s → {seg.end_time?.toFixed(1)}s
                          </Typography>
                          <Chip size="small" label={segVoice?.name || 'No Voice'} sx={{ ml: 'auto', height: 20, fontSize: '0.6rem', fontWeight: 700, background: segVoice ? 'rgba(232, 160, 32,0.1)' : 'rgba(17,17,17,0.05)', color: segVoice ? AC : 'rgba(17,17,17,0.4)' }} />
                        </Stack>

                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.65rem', color: 'rgba(17, 17, 17,0.4)', mb: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>Original Text</Typography>
                              <Typography sx={{ fontSize: '0.85rem', color: '#111111', p: 1.5, background: 'rgba(17,17,17,0.03)', borderRadius: '8px' }}>{seg.text}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.65rem', color: AC, mb: 0.5, fontWeight: 700, textTransform: 'uppercase' }}>Translation</Typography>
                              <TextField
                                fullWidth multiline minRows={1}
                                placeholder="Enter translation..."
                                value={seg.translated || ''}
                                onChange={e => { const n = [...segments]; n[i].translated = e.target.value; setSegments(n); }}
                                onClick={e => e.stopPropagation()}
                                sx={{ '& .MuiOutlinedInput-root': { color: '#111111', borderRadius: '8px', fontSize: '0.85rem', background: 'rgba(232,160,32,0.03)' } }}
                              />
                          </Grid>
                        </Grid>
                      </Box>
                    );
                  })}
                </Stack>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel sx={{ color: 'rgba(17, 17, 17,0.5)', '&.Mui-focused': { color: AC } }}>Target Language</InputLabel>
                  <Select value={targetLang} label="Target Language" onChange={e => setTargetLang(e.target.value)}
                    sx={{ borderRadius: '12px', color: '#111111', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(17, 17, 17, 0.15)' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: AC } }}
                  >
                    {NEURAL_LANGUAGES.filter(l => l.code !== 'all').map(l => <MenuItem key={l.code} value={l.code}>{l.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Stack direction="row" spacing={2}>
                  <Button variant="contained" onClick={handleTranslateSegments} disabled={loading} sx={{ background: G, color: '#fff', fontWeight: 800, px: 4, borderRadius: '8px' }}>
                    {loading ? 'Translating...' : 'Confirm Translations'}
                  </Button>
                  <Button variant="contained" onClick={handleNext} sx={{ background: G, color: '#fff', fontWeight: 800, px: 4, borderRadius: '8px' }}>
                    Next
                  </Button>
                  <Button onClick={handleBack} sx={{ color: 'rgba(17,17,17,0.6)', fontWeight: 700 }}>Back</Button>
                </Stack>
              </Box>
            </Paper>
          </StepContent>
        </Step>

        {/* Step 3: Choose Speaker */}
        <Step>
          <StepLabel>Step 3: Select Target Voice</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Typography sx={{ fontSize: '0.85rem', color: 'rgba(17,17,17,0.6)', mb: 3, fontWeight: 600 }}>
                Choose the voice and target language for your dubbed video. You can assign different voices to individual speakers later.
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={12} lg={12}>
                  <VoicePanel selectedId={globalSpeaker.id} onSelect={handleGlobalVoiceSelect} />
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

        {/* Step 4: Review & Generate */}
        <Step>
          <StepLabel>Step 4: Configure Video & Generate Dubbing</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 3, mb: 2, ...GLASS, mt: 1 }}>
              <Grid container spacing={4}>
                  <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: '0.9rem', color: '#111111', mb: 2, fontWeight: 800 }}>Video Configuration</Typography>
                      <Stack spacing={3}>
                        <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.22)' }}>
                          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#047857', lineHeight: 1.55 }}>
                            Original audio is fully removed. Only your dubbed voices will be heard in the final export.
                          </Typography>
                        </Box>

                        <Box>
                            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(17, 17, 17,0.6)' }}>Trim Range</Typography>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 900, color: '#f43f5e' }}>{fmtDuration(trimRange[0])} → {fmtDuration(trimRange[1])}</Typography>
                            </Stack>
                            <Slider value={trimRange} onChange={(_, v) => setTrimRange(v)} min={0} max={videoDuration} valueLabelDisplay="auto" sx={{ color: '#f43f5e' }} />
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, background: 'rgba(17,17,17,0.03)', borderRadius: '12px' }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#111111' }}>Burn Subtitles into Video</Typography>
                            <Chip
                                label={burnSubtitles ? 'Enabled' : 'Disabled'}
                                onClick={() => setBurnSubtitles(v => !v)}
                                sx={{ cursor: 'pointer', fontWeight: 800, background: burnSubtitles ? 'rgba(16,185,129,0.15)' : 'rgba(17,17,17,0.08)', color: burnSubtitles ? '#10b981' : 'rgba(17,17,17,0.5)' }}
                            />
                        </Box>
                      </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                      <Typography sx={{ fontSize: '0.9rem', color: '#111111', mb: 2, fontWeight: 800 }}>Summary</Typography>
                      <Stack spacing={2} sx={{ p: 2, background: 'rgba(232,160,32,0.05)', borderRadius: '12px', border: `1px solid ${AC}30` }}>
                          <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Target Language:</strong> {NEURAL_LANGUAGES.find(l => l.code === targetLang)?.name}</Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Segments Translated:</strong> {segments.filter(s => s.translated).length} / {segments.length}</Typography>
                          <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Primary Voice:</strong> {globalSpeaker.name}</Typography>
                          
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#111111' }}><strong>Length:</strong> {videoDuration ? `${Math.round(videoDuration / 60 * 10) / 10} min` : '—'}</Typography>
                            <CreditEstimateChip service="video_dubbing" quantity={Math.max(videoDuration / 60, videoDuration ? 0.1 : 0)} balance={userBalance} />
                          </Stack>

                          <Divider sx={{ my: 1, borderColor: `${AC}20` }} />
                          
                          <Button variant="contained" fullWidth onClick={() => handleExportMaster(false)} disabled={exporting} startIcon={<AutoAwesome />} sx={{ background: G, color: '#fff', py: 1.5, borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
                            Generate Video Dubbing
                          </Button>
                          <Button
                            variant="outlined" fullWidth onClick={() => handleExportMaster(true)} disabled={exporting}
                            startIcon={<NotificationsActiveIcon />}
                            sx={{ borderColor: `${AC}66`, color: AC, py: 1.2, borderRadius: '12px', fontWeight: 800, fontSize: '0.82rem', textTransform: 'none', '&:hover': { borderColor: AC, background: 'rgba(232,160,32,0.06)' } }}
                          >
                            Render in background & email me
                          </Button>
                          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(17,17,17,0.45)', textAlign: 'center' }}>
                            Long videos can keep rendering after you leave — we'll email you and add it to your library when it's done.
                          </Typography>
                      </Stack>
                  </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button onClick={handleBack} sx={{ color: 'rgba(17,17,17,0.6)', fontWeight: 700 }}>Back</Button>
              </Box>
            </Paper>
          </StepContent>
        </Step>

        {/* Step 5: Final Result */}
        <Step>
          <StepLabel>Step 5: View & Download Product</StepLabel>
          <StepContent>
            <Paper elevation={0} sx={{ p: 4, mb: 2, ...GLASS, mt: 1, textAlign: 'center' }}>
                <CheckCircleOutline sx={{ fontSize: 64, color: '#10b981', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 900, color: '#111111', mb: 1 }}>Dubbing Complete!</Typography>
                <Typography sx={{ fontSize: '0.9rem', color: 'rgba(17,17,17,0.6)', mb: 3 }}>
                  Your video has been dubbed — original audio replaced with the new voice track.
                </Typography>

                {finalMasterUrl && (
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: { xs: '100%', sm: 720, md: 920 },
                      mx: 'auto',
                      mb: 4,
                      borderRadius: '20px',
                      overflow: 'hidden',
                      background: '#0a0a0a',
                      border: `1px solid rgba(232,160,32,0.22)`,
                      boxShadow: '0 28px 72px rgba(17,17,17,0.2), 0 0 0 1px rgba(255,255,255,0.04) inset',
                    }}
                  >
                    <Box sx={{ position: 'relative', width: '100%', pt: '56.25%', background: '#000' }}>
                      <video
                        src={finalMasterUrl}
                        controls
                        playsInline
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          display: 'block',
                          background: '#000',
                        }}
                      />
                    </Box>
                    <Box sx={{ px: 2.5, py: 1.25, background: 'rgba(17,17,17,0.94)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                        Dubbed master preview
                      </Typography>
                      <Chip label="Original audio removed" size="small" sx={{ height: 22, fontSize: '0.62rem', fontWeight: 800, bgcolor: 'rgba(232,160,32,0.15)', color: AC, border: `1px solid ${AC}44` }} />
                    </Box>
                  </Box>
                )}

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button variant="contained" href={finalMasterUrl} target="_blank" download startIcon={<Download />} sx={{ background: G, color: '#fff', fontWeight: 800, px: 4, py: 1.5, borderRadius: '12px' }}>
                        Download Master Video
                    </Button>
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
    </Box>
  );
}
