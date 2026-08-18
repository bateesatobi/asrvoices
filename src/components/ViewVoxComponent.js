import React, { useEffect, useState, useMemo } from "react";
import { Typography, Button, Stack, Box, Tooltip } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import HearingIcon from '@mui/icons-material/Hearing';
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { dataAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import { getLanguageDisplayName } from '../utils/translationViewHelpers';
import {
  ResultViewLayout, ResultLangAccordion, rvPrimaryButtonSx, RV_AC,
  ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import MediaTrimEditor from './MediaTrimEditor';

const formatTime = (s) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

const segmentsToText = (segments) => {
  if (!segments?.length) return '';
  return segments
    .map((item) => (typeof item === 'string' ? item : `[${formatTime(item.start_time || 0)}] ${item.text}`))
    .join('\n');
};

const ViewVoxComponent = ({ voiceId }) => {
  const [translationData, setTranslationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioError, setAudioError] = useState({});
  const [editedTexts, setEditedTexts] = useState({});
  const navigate = useNavigate();
  const { balance, lowCredits, exportBlockedTitle, downloadBlob, downloadUrl, ensureCredits } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await dataAPI.getTTSVoice(voiceId);
        if (!response.entries?.length) throw new Error("No entries");
        setTranslationData(response.entries[0]);
      } catch {
        notify("Failed to load voice data", "error");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [voiceId, notify]);

  const getTranslationText = (translation) => {
    if (typeof translation === 'string') return translation;
    if (Array.isArray(translation)) return translation.map(s => s.text).join('\n');
    return "No translation available";
  };

  const originalPlainText = useMemo(
    () => segmentsToText(translationData?.Original_transcript),
    [translationData]
  );

  const handleDownloadTranscript = async (language, texts) => {
    const content = typeof texts === 'string' ? texts : segmentsToText(texts);
    if (!content) {
      notify('No transcript to download', 'error');
      return;
    }
    await downloadBlob(content, `transcript_${language}.txt`, 'text/plain', notify);
  };

  const handleDownloadAudio = async (audioUrl) => {
    await downloadUrl(audioUrl, notify);
  };

  const dlButtons = (audioUrl, lang, transcriptText) => (
    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
      <Tooltip title={!lowCredits ? 'Download audio' : exportBlockedTitle}>
        <span>
          <Button
            size="small"
            startIcon={<CloudDownloadIcon />}
            onClick={() => handleDownloadAudio(audioUrl)}
            disabled={lowCredits}
            sx={rvPrimaryButtonSx}
          >
            Audio
          </Button>
        </span>
      </Tooltip>
      {transcriptText && (
        <Tooltip title={!lowCredits ? 'Download transcript' : exportBlockedTitle}>
          <span>
            <Button
              size="small"
              startIcon={<CloudDownloadIcon />}
              onClick={() => handleDownloadTranscript(lang, transcriptText)}
              disabled={lowCredits}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, border: '1px solid rgba(232, 160, 32, 0.35)', color: RV_AC }}
            >
              Transcript
            </Button>
          </span>
        </Tooltip>
      )}
    </Stack>
  );

  const pageTitle = 'Voice to Voice';
  const displayOriginal = editedTexts.original ?? originalPlainText;

  return (
    <>
      <ResultViewLayout
        type="vox"
        title={pageTitle}
        date={translationData?.Date}
        onBack={() => navigate(-1)}
        loading={loading}
        empty={!loading && !translationData}
        emptyMessage="Failed to load voice data"
        emptyIcon={HearingIcon}
        badges={translationData ? [
          { label: `Source: ${getLanguageDisplayName(translationData.source_lang)}` },
          { label: `${Object.keys(translationData.audio_urls || {}).length} outputs` },
        ] : []}
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
            <ResultShareBar title={pageTitle} text={displayOriginal || pageTitle} onNotify={notify} compact />
          </Stack>
        }
      >
        {translationData && (
          <>
            <ResultLangAccordion
              langCode={translationData.source_lang || 'src'}
              langLabel={`Original (${getLanguageDisplayName(translationData.source_lang)})`}
              defaultExpanded
              text={displayOriginal}
              editable={!!displayOriginal}
              onSave={(val) => setEditedTexts((prev) => ({ ...prev, original: val }))}
              shareTitle={pageTitle}
              shareText={displayOriginal}
              onNotify={notify}
            >
              {translationData.Original_transcript?.length > 0 && !displayOriginal && (
                translationData.Original_transcript.map((seg, i) => (
                  <Box key={i} sx={{ mb: 1.5, display: 'flex', gap: 2 }}>
                    <Typography sx={{ color: RV_AC, fontSize: '0.78rem', fontWeight: 800, minWidth: 48, mt: 0.2 }}>
                      {formatTime(seg.start_time || 0)}
                    </Typography>
                    <Typography sx={{ color: 'rgba(17, 17, 17, 0.72)', lineHeight: 1.75 }}>{seg.text}</Typography>
                  </Box>
                ))
              )}
              {translationData.orginal_audio_url && !audioError.original && (
                <Box sx={{ mt: 2 }}>
                  <AudioPlayer
                    src={translationData.orginal_audio_url}
                    customVolumeControls={[]}
                    customAdditionalControls={[]}
                    showJumpControls={false}
                    onError={() => setAudioError(p => ({ ...p, original: true }))}
                  />
                  <Box sx={{ mt: 2 }}>
                    <MediaTrimEditor
                      url={translationData.orginal_audio_url}
                      filename={`vox_${translationData.source_lang || 'original'}_trim`}
                      onNotify={notify}
                      ensureExport={ensureCredits}
                      height={72}
                    />
                  </Box>
                  {dlButtons(translationData.orginal_audio_url, translationData.source_lang || 'original', displayOriginal)}
                </Box>
              )}
            </ResultLangAccordion>

            {translationData.audio_urls && Object.entries(translationData.audio_urls).map(([langCode, audioUrl], i) => {
              if (!audioUrl || typeof audioUrl !== 'string') return null;
              const translation = translationData.Translations?.[langCode];
              const baseText = getTranslationText(translation);
              const langText = editedTexts[langCode] ?? baseText;
              return (
                <ResultLangAccordion
                  key={langCode}
                  langCode={langCode}
                  langLabel={`${getLanguageDisplayName(langCode)} translation`}
                  defaultExpanded={i === 0}
                  text={langText}
                  editable={!!langText}
                  onSave={(val) => setEditedTexts((prev) => ({ ...prev, [langCode]: val }))}
                  shareTitle={`${pageTitle} — ${getLanguageDisplayName(langCode)}`}
                  shareText={langText}
                  onNotify={notify}
                >
                  {!audioError[langCode] ? (
                    <AudioPlayer
                      src={audioUrl}
                      customVolumeControls={[]}
                      customAdditionalControls={[]}
                      showJumpControls={false}
                      onError={() => setAudioError(p => ({ ...p, [langCode]: true }))}
                    />
                  ) : (
                    <Typography sx={{ color: '#ef4444', mb: 1 }}>Cannot play {getLanguageDisplayName(langCode)} audio</Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <MediaTrimEditor
                      url={audioUrl}
                      filename={`vox_${langCode}_trim`}
                      onNotify={notify}
                      ensureExport={ensureCredits}
                      height={72}
                    />
                  </Box>
                  {dlButtons(audioUrl, langCode, langText)}
                </ResultLangAccordion>
              );
            })}
          </>
        )}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewVoxComponent;
