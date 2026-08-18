import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, IconButton, Chip, Stack, Tooltip, Alert,
} from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import LanguageIcon from '@mui/icons-material/Language';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import { transcriptionAPI, videoAPI } from '../services/api';
import AudioPlayerComponent from "./AudioPlayerComponent";
import MediaTrimEditor from './MediaTrimEditor';
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import { getLanguageDisplayName, resolveMediaAudioUrl, resolveOriginalTranscript, isTranscriptionProcessing } from '../utils/translationViewHelpers';
import {
  ResultViewLayout, ResultSection, ResultLangAccordion, ResultCodeBlock, ResultTextPanel,
  rvLangChipSx, RV_AC, ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import SendToStudioButton from './SendToStudioButton';

const getStoredUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    return u.uid || u.userId || null;
  } catch {
    return null;
  }
};

const ViewAudioComponent = ({ audioId, embedded = false, onError }) => {
  const [entries, setEntries] = useState([]);
  const [audioSource, setAudioSource] = useState("");
  const [audioDate, setDate] = useState("");
  const [audioTitle, setTitle] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [currentSegment, setCurrentSegment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [editedTexts, setEditedTexts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const navigate = useNavigate();
  const { balance, lowCredits, exportBlockedTitle, copyText, downloadBlob, ensureCredits } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  const renderTranslationContent = (data) => {
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map(s => s.text).join(' ');
    return "No translation available";
  };

  const updateSegmentDisplay = (segments, time) => {
    if (typeof segments === 'string') { setCurrentSegment(segments); return; }
    if (Array.isArray(segments) && segments.length > 0) {
      const active = segments.find(s => time >= s.start_time && time <= s.end_time);
      setCurrentSegment(active ? active.text : "No transcript at this time");
    } else { setCurrentSegment("No transcript available"); }
  };

  const loadAudio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transcriptionAPI.getAudio(audioId);
      let data = response.entries || [];

      // Video transcriptions live in video_store — redirect instead of showing empty.
      if (!data.length) {
        try {
          const videoRes = await videoAPI.getVideo(audioId);
          if (videoRes.entries?.length) {
            navigate(`/dashboard/video/${audioId}`, { replace: true });
            return;
          }
        } catch {
          /* not a video job */
        }
      }

      setEntries(data);
      if (data.length === 0) return;

      const entry = data[0];
      const audioUrl = resolveMediaAudioUrl(entry);
      if (audioUrl) setAudioSource(audioUrl);

      setDate(entry.Date || entry.date);
      setTitle(entry.title || entry.fileName || 'Audio Transcription');

      const langs = Object.keys(entry.Translations || entry.translations || {});
      setAvailableLanguages(langs);
      if (langs.length > 0) {
        setSelectedLanguage(langs[0]);
        const translations = entry.Translations || entry.translations;
        updateSegmentDisplay(translations[langs[0]], 0);
      }
    } catch {
      const msg = "Failed to fetch audio data.";
      setError(msg);
      onError?.({ message: msg });
    } finally {
      setLoading(false);
    }
  }, [audioId, onError, navigate]);

  useEffect(() => {
    loadAudio();
  }, [loadAudio]);

  // Poll while the backend is still transcribing.
  useEffect(() => {
    const entry = entries[0];
    if (!entry || !isTranscriptionProcessing(entry)) return undefined;
    const iv = setInterval(loadAudio, 4000);
    return () => clearInterval(iv);
  }, [entries, loadAudio]);

  const handleDownloadTranscript = async () => {
    if (!entries.length || !selectedLanguage) return;
    const data = entries[0].Translations[selectedLanguage];
    const text = typeof data === 'string' ? data : Array.isArray(data) ? data.map(s => s.text).join('\n\n') : "No transcript";
    await downloadBlob(text, `transcript_${selectedLanguage}_${audioTitle}.txt`, 'text/plain', notify);
  };

  const entry = entries[0];
  const baseOriginal = resolveOriginalTranscript(entry);
  const originalText = editedTexts.original ?? baseOriginal;
  const stillProcessing = entry && isTranscriptionProcessing(entry);
  const audioWarning = entry && !audioSource && !stillProcessing && !baseOriginal
    ? null
    : entry && !audioSource && !stillProcessing && baseOriginal
      ? 'Audio file is unavailable, but your transcript is shown below.'
      : null;

  const getLangText = (code) => {
    if (editedTexts[code] != null) return editedTexts[code];
    return renderTranslationContent(entry?.Translations?.[code]);
  };

  const pipelineText = () => {
    if (selectedLanguage && entry?.Translations?.[selectedLanguage]) {
      return getLangText(selectedLanguage);
    }
    return originalText || '';
  };
  const pipelineLang = selectedLanguage || entry?.source_lang || 'en';

  const handleSaveOriginal = async (trimmed) => {
    const userId = getStoredUserId();
    if (!userId) {
      setSaveMsg({ type: 'error', text: 'Please log in again to save changes.' });
      throw new Error('not authenticated');
    }
    setSaving(true);
    setSaveMsg(null);
    try {
      await transcriptionAPI.updateTranscript(audioId, userId, trimmed);
      setEntries(prev => {
        if (!prev.length) return prev;
        const next = [...prev];
        const updated = { ...next[0], Original_transcript: trimmed, original_transcript: trimmed };
        if (typeof updated.formatted_transcript === 'string') {
          updated.formatted_transcript = trimmed;
        }
        next[0] = updated;
        return next;
      });
      setEditedTexts(prev => ({ ...prev, original: trimmed }));
      setSaveMsg({ type: 'success', text: 'Transcript saved.' });
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      setSaveMsg({
        type: 'error',
        text: e.response?.data?.detail || 'Could not save transcript. Please try again.',
      });
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = audioTitle || 'Audio Transcription';

  const headerActions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
      <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
      <ResultShareBar title={pageTitle} text={originalText || pageTitle} onNotify={notify} compact />
      {availableLanguages.map(lang => (
        <Chip
          key={lang}
          label={getLanguageDisplayName(lang)}
          size="small"
          onClick={() => {
            setSelectedLanguage(lang);
            if (entry?.Translations) updateSegmentDisplay(entry.Translations[lang], 0);
          }}
          sx={rvLangChipSx(lang === selectedLanguage)}
        />
      ))}
      {selectedLanguage && (
        <Tooltip title={!lowCredits ? 'Download transcript' : exportBlockedTitle}>
          <span>
            <IconButton
              size="small"
              onClick={handleDownloadTranscript}
              disabled={lowCredits}
              sx={{ background: 'rgba(232, 160, 32, 0.1)', color: RV_AC, border: '1px solid rgba(232, 160, 32, 0.22)' }}
            >
              <DownloadIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {(originalText || availableLanguages.length > 0) && (
        <SendToStudioButton
          targets={['translate', 'synthesize', 'voiceover', 'dubbing']}
          getPayload={() => ({ text: pipelineText(), sourceLang: entry?.source_lang || 'en', targetLang: pipelineLang })}
        />
      )}
    </Stack>
  );

  const formattedText = typeof entry?.formatted_transcript === 'string'
    ? entry.formatted_transcript
    : entry?.formatted_transcript
      ? JSON.stringify(entry.formatted_transcript, null, 2)
      : '';

  return (
    <>
      <ResultViewLayout
        type="transcription"
        title={pageTitle}
        date={audioDate}
        onBack={embedded ? null : () => navigate(-1)}
        loading={loading || stillProcessing}
        error={error}
        empty={!loading && !stillProcessing && !error && entries.length === 0}
        emptyMessage="No transcription data"
        emptyIcon={GraphicEqIcon}
        headerActions={headerActions}
        badges={availableLanguages.length ? [{ label: `${availableLanguages.length} languages` }] : []}
        maxWidth={embedded ? false : 'lg'}
      >
        {saveMsg && (
          <Alert severity={saveMsg.type} onClose={() => setSaveMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
            {saveMsg.text}
          </Alert>
        )}

        {audioWarning && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '12px' }}>
            {audioWarning}
          </Alert>
        )}

        {stillProcessing && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '12px' }}>
            Transcription in progress — this page will update automatically.
          </Alert>
        )}

        {entry && (
          <>
            <ResultTextPanel
              title={`Original transcript (${getLanguageDisplayName(entry.source_lang)})`}
              icon={LanguageIcon}
              text={originalText}
              defaultExpanded
              editable
              saving={saving}
              onSave={handleSaveOriginal}
              onCopy={originalText ? () => copyText(originalText, notify) : undefined}
              shareTitle={pageTitle}
              shareText={originalText}
              onNotify={notify}
              minRows={embedded ? 8 : 12}
              emptyMessage="No original transcript available"
            />

            {entry.formatted_transcript && (
              <ResultSection
                title={`Formatted output (${(entry.response_format || 'raw').toUpperCase()})`}
                icon={LanguageIcon}
                highlight
                defaultExpanded={false}
                onCopy={() => copyText(formattedText, notify)}
                shareTitle={`${pageTitle} — formatted`}
                shareText={formattedText}
                onNotify={notify}
              >
                <ResultCodeBlock>{formattedText}</ResultCodeBlock>
              </ResultSection>
            )}

            {availableLanguages.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 800, color: '#111111', fontSize: '0.9rem', mb: 2, px: 0.5 }}>
                  Translations ({availableLanguages.length})
                </Typography>
                {availableLanguages.map((langCode, i) => {
                  const langText = getLangText(langCode);
                  return (
                    <ResultLangAccordion
                      key={langCode}
                      langCode={langCode}
                      langLabel={getLanguageDisplayName(langCode)}
                      meta={`${String(langText || '').length} chars`}
                      expanded={activeTab === i}
                      onChange={() => setActiveTab(i)}
                      text={langText}
                      editable
                      onSave={(val) => setEditedTexts(prev => ({ ...prev, [langCode]: val }))}
                      onCopy={() => copyText(langText, notify)}
                      shareTitle={`${pageTitle} — ${getLanguageDisplayName(langCode)}`}
                      shareText={langText}
                      onNotify={notify}
                    />
                  );
                })}
              </Box>
            )}

            {selectedLanguage && currentSegment && (
              <ResultSection title={`Now playing — ${getLanguageDisplayName(selectedLanguage)}`} highlight defaultExpanded={false}>
                <Typography sx={{ color: '#111111', fontWeight: 600, lineHeight: 1.75 }}>
                  {currentSegment}
                </Typography>
              </ResultSection>
            )}

            {audioSource && (
              <ResultSection title="Source audio — trim & edit" icon={GraphicEqIcon} defaultExpanded={false} collapsible>
                <Box sx={{ mb: 2 }}>
                  <AudioPlayerComponent
                    audioSrc={audioSource}
                    onTimeUpdate={(t) => {
                      if (entry && selectedLanguage && entry.Translations) {
                        updateSegmentDisplay(entry.Translations[selectedLanguage], t);
                      }
                    }}
                  />
                </Box>
                <MediaTrimEditor
                  url={audioSource}
                  filename={`${(audioTitle || 'transcript').replace(/\s+/g, '_')}_audio_trim`}
                  onNotify={notify}
                  ensureExport={ensureCredits}
                />
              </ResultSection>
            )}
          </>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewAudioComponent;
