import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, IconButton, Tooltip, Chip, Stack, Alert,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import LanguageIcon from '@mui/icons-material/Language';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { dataAPI } from '../services/api';
import YouTubeVideoComponent from "./YouTubeVideoComponent";
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import { getLanguageDisplayName, resolveOriginalTranscript, isTranscriptionProcessing, resolveMediaVideoUrl, isYouTubeUrl, isDirectVideoUrl } from '../utils/translationViewHelpers';
import {
  ResultViewLayout, ResultSection, ResultLangAccordion, ResultCodeBlock, ResultTextPanel,
  rvLangChipSx, RV_AC, ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';

const VideoPlaceholder = ({ filename }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'rgba(232, 160, 32, 0.05)', border: '2px dashed rgba(232, 160, 32, 0.28)', borderRadius: '12px', textAlign: 'center', p: 4 }}>
    <VideoFileIcon sx={{ fontSize: 72, color: RV_AC, mb: 2, opacity: 0.6 }} />
    <Typography sx={{ color: '#111111', fontWeight: 700, mb: 1 }}>Video processed</Typography>
    <Typography sx={{ color: 'rgba(17, 17, 17, 0.5)', fontSize: '0.85rem', mb: 2 }}>{filename || 'Video file'}</Typography>
    <Stack direction="row" alignItems="center" gap={1}>
      <PlayCircleOutlineIcon sx={{ color: RV_AC, fontSize: 18 }} />
      <Typography variant="body2" sx={{ color: RV_AC, fontWeight: 600 }}>Audio extracted and transcribed</Typography>
    </Stack>
  </Box>
);

const ViewVideoComponent = ({ audioId }) => {
  const navigate = useNavigate();
  const translationsRef = useRef(null);
  const playerRef = useRef(null);
  const { balance, lowCredits, exportBlockedTitle, copyText, downloadBlob } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  const [videoData, setVideoData] = useState({ url: "", date: "", title: "", source_lang: "en", formatted_transcript: null, response_format: null });
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [transcripts, setTranscripts] = useState({ full: "", current: "", segments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editedTexts, setEditedTexts] = useState({});

  const initializeTranscript = useCallback((language, translations) => {
    if (!translations) { setTranscripts({ full: "", current: "No transcript available", segments: [] }); return; }
    if (typeof translations === 'string') {
      const clean = translations.replace(/^"|"$/g, '');
      setTranscripts({ full: clean, current: clean, segments: [{ text: clean, start_time: 0, end_time: 0 }] });
      return;
    }
    if (Array.isArray(translations)) {
      const full = translations.map(s => s.text).join('\n\n');
      setTranscripts({ full, current: translations[0]?.text || "No transcript", segments: translations });
    }
  }, []);

  const updateCurrentTranscript = useCallback((time) => {
    if (!transcripts.segments.length) return;
    const seg = transcripts.segments.find(s => time >= s.start_time && time <= s.end_time);
    if (seg) setTranscripts(prev => ({ ...prev, current: seg.text }));
  }, [transcripts.segments]);

  const loadVideo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dataAPI.getVideo(audioId);
      const entries = response.entries;
      if (!entries?.length) throw new Error("No video data available");
      const entry = entries[0];
      translationsRef.current = entry.translations || entry.Translations;
      const resolvedUrl = resolveMediaVideoUrl(entry);
      setVideoData({
        url: resolvedUrl,
        date: entry.Date || entry.date,
        title: entry.title || entry.fileName || "Video Transcription",
        source_lang: entry.source_lang || 'en',
        formatted_transcript: entry.formatted_transcript,
        response_format: entry.response_format,
        status: entry.status,
        fileName: entry.fileName || entry.filename || '',
      });
      const langs = Object.keys(entry.translations || entry.Translations || {});
      setLanguages(langs);
      if (langs.length > 0) {
        setSelectedLanguage(langs[0]);
        initializeTranscript(langs[0], (entry.translations || entry.Translations)[langs[0]]);
      }
      const original = resolveOriginalTranscript(entry);
      if (original) setTranscripts(prev => ({ ...prev, full: original }));
    } catch (err) {
      setError(err.message || "Failed to fetch video data");
    } finally {
      setLoading(false);
    }
  }, [audioId, initializeTranscript]);

  useEffect(() => {
    loadVideo();
  }, [loadVideo]);

  useEffect(() => {
    if (!videoData.status || !isTranscriptionProcessing({ status: videoData.status })) return undefined;
    const iv = setInterval(loadVideo, 4000);
    return () => clearInterval(iv);
  }, [videoData.status, loadVideo]);

  const handleLanguageChange = useCallback((lang) => {
    if (!translationsRef.current?.[lang]) return;
    setSelectedLanguage(lang);
    initializeTranscript(lang, translationsRef.current[lang]);
  }, [initializeTranscript]);

  const handleTimeUpdate = useCallback((time) => { updateCurrentTranscript(time); }, [updateCurrentTranscript]);

  const handleDownload = useCallback(async () => {
    if (!transcripts.segments.length) return;
    const text = transcripts.segments.map(s => s.text).join('\n\n');
    await downloadBlob(text, `transcript_${selectedLanguage}_${videoData.title}.txt`, 'text/plain', notify);
  }, [transcripts.segments, selectedLanguage, videoData.title, downloadBlob, notify]);

  const downloadTranslation = async (language, translations) => {
    const text = Array.isArray(translations) ? translations.map(s => s.text).join('\n\n') : (typeof translations === 'string' ? translations : '');
    await downloadBlob(text, `translation_${language}_${videoData.title}.txt`, 'text/plain', notify);
  };

  const getTranslationText = (translations) => {
    if (Array.isArray(translations)) return translations.map(s => s.text).join(' ');
    if (typeof translations === 'string') return translations;
    return "No translation available";
  };

  const pageTitle = videoData.title || 'Video Translation';
  const displayOriginal = editedTexts.original ?? transcripts.full;

  const langChips = (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
      <ResultShareBar title={pageTitle} text={displayOriginal || pageTitle} onNotify={notify} compact />
      {languages.map(lang => (
        <Chip key={lang} label={getLanguageDisplayName(lang)} size="small" onClick={() => handleLanguageChange(lang)} sx={rvLangChipSx(selectedLanguage === lang)} />
      ))}
      {languages.length > 0 && (
        <Tooltip title={!lowCredits ? 'Download transcript' : exportBlockedTitle}>
          <span>
            <IconButton
              size="small"
              onClick={handleDownload}
              disabled={lowCredits}
              sx={{ background: 'rgba(232, 160, 32, 0.1)', color: RV_AC, border: '1px solid rgba(232, 160, 32, 0.22)' }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );

  const stillProcessing = isTranscriptionProcessing({ status: videoData.status });

  return (
    <>
      <ResultViewLayout
        type="video"
        title={pageTitle}
        date={videoData.date}
        onBack={() => navigate(-1)}
        loading={loading || stillProcessing}
        error={error}
        headerActions={langChips}
        badges={languages.length ? [{ label: `${languages.length} languages` }] : []}
      >
        {stillProcessing && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
            Transcription in progress — this page will update automatically.
          </Alert>
        )}

        <Box sx={{ position: 'relative', paddingTop: '56.25%', borderRadius: '16px', overflow: 'hidden', background: 'rgba(17, 17, 17, 0.03)', border: '1px solid rgba(17, 17, 17, 0.06)', mb: 3 }}>
          <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
            {isYouTubeUrl(videoData.url) ? (
              <YouTubeVideoComponent videoUrl={videoData.url} onTimeUpdate={handleTimeUpdate} ref={playerRef} />
            ) : isDirectVideoUrl(videoData.url) ? (
              <video
                ref={playerRef}
                src={videoData.url}
                controls
                playsInline
                onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget.currentTime)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#111' }}
              />
            ) : (
              <VideoPlaceholder filename={videoData.fileName || videoData.url} />
            )}
          </Box>
        </Box>

        <ResultTextPanel
          title={`Original transcript (${getLanguageDisplayName(videoData.source_lang)})`}
          icon={LanguageIcon}
          text={displayOriginal}
          defaultExpanded
          editable
          onSave={(text) => setEditedTexts((prev) => ({ ...prev, original: text }))}
          onCopy={displayOriginal ? () => copyText(displayOriginal, notify) : undefined}
          shareTitle={pageTitle}
          shareText={displayOriginal}
          onNotify={notify}
          emptyMessage="No original transcript available"
        />

        {videoData.formatted_transcript && (
          <ResultSection
            title={`Formatted output (${(videoData.response_format || 'raw').toUpperCase()})`}
            highlight
            defaultExpanded={false}
            onCopy={() => copyText(
              typeof videoData.formatted_transcript === 'string'
                ? videoData.formatted_transcript
                : JSON.stringify(videoData.formatted_transcript, null, 2),
              notify
            )}
            shareTitle={`${pageTitle} — formatted`}
            shareText={typeof videoData.formatted_transcript === 'string'
              ? videoData.formatted_transcript
              : JSON.stringify(videoData.formatted_transcript, null, 2)}
            onNotify={notify}
          >
            <ResultCodeBlock>
              {typeof videoData.formatted_transcript === 'string'
                ? videoData.formatted_transcript
                : JSON.stringify(videoData.formatted_transcript, null, 2)}
            </ResultCodeBlock>
          </ResultSection>
        )}

        {languages.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.9rem', mb: 2, px: 0.5 }}>
              Translations ({languages.length})
            </Typography>
            {languages.map((language) => {
              const translations = translationsRef.current?.[language];
              const segmentCount = Array.isArray(translations) ? translations.length : 0;
              const baseText = getTranslationText(translations);
              const text = editedTexts[language] ?? baseText;
              return (
                <ResultLangAccordion
                  key={language}
                  langCode={language}
                  langLabel={getLanguageDisplayName(language)}
                  meta={`${segmentCount} segments`}
                  expanded={selectedLanguage === language}
                  onChange={() => handleLanguageChange(language)}
                  text={text}
                  editable
                  onSave={(val) => setEditedTexts((prev) => ({ ...prev, [language]: val }))}
                  onCopy={text ? () => copyText(text, notify) : undefined}
                  shareTitle={`${pageTitle} — ${getLanguageDisplayName(language)}`}
                  shareText={text}
                  onNotify={notify}
                  headerActions={
                    <Tooltip title={!lowCredits ? 'Download translation' : exportBlockedTitle}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); downloadTranslation(language, translations); }}
                          disabled={lowCredits}
                          sx={{ color: 'rgba(17, 17, 17, 0.35)', '&:hover': { color: RV_AC } }}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  }
                />
              );
            })}
          </Box>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewVideoComponent;
