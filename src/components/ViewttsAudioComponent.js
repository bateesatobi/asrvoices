import React, { useEffect, useState } from "react";
import { Button, Box, Stack, Tooltip } from "@mui/material";
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import { dataAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import useExportGate from '../hooks/useExportGate';
import { getLanguageDisplayName } from '../utils/translationViewHelpers';
import {
  ResultViewLayout, ResultLangAccordion, rvPrimaryButtonSx,
  ExportCreditsChip, ResultViewSnackbar, useResultNotify, ResultShareBar,
} from './result-view';
import MediaTrimEditor from './MediaTrimEditor';

const ViewttsAudioComponent = ({ audioId }) => {
  const [entries, setEntries] = useState([]);
  const [audioDate, setAudioDate] = useState("");
  const [audioTitle, setAudioTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [editedTexts, setEditedTexts] = useState({});
  const navigate = useNavigate();
  const { balance, lowCredits, exportBlockedTitle, copyText, downloadUrl, ensureCredits } = useExportGate();
  const { snackbar, notify, closeNotify } = useResultNotify();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await dataAPI.getVocifyVoice(audioId);
        const fetchedEntries = response.entries;
        if (fetchedEntries.length > 0) {
          setEntries(fetchedEntries);
          setAudioDate(fetchedEntries[0].date);
          setAudioTitle(fetchedEntries[0].title);
        }
      } catch {
        notify('Failed to fetch audio data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [audioId, notify]);

  const entry = entries[0];
  const ttsMap = entry?.translations_with_tts || {};
  const pageTitle = audioTitle || 'Synthesized audio';
  const firstLangText = Object.values(ttsMap)[0]?.translation || pageTitle;

  return (
    <>
      <ResultViewLayout
        type="tts"
        title={pageTitle}
        date={audioDate}
        onBack={() => navigate(-1)}
        loading={loading}
        empty={!loading && entries.length === 0}
        emptyMessage="No synthesis data available"
        emptyIcon={RecordVoiceOverIcon}
        badges={[
          { label: `${Object.keys(ttsMap).length || 0} languages` },
          { label: 'Audio ready' },
        ]}
        headerActions={
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <ExportCreditsChip balance={balance} lowCredits={lowCredits} />
            <ResultShareBar title={pageTitle} text={firstLangText} onNotify={notify} compact />
          </Stack>
        }
      >
        {Object.entries(ttsMap).map(([lang, data], i) => {
          const langText = editedTexts[lang] ?? data.translation;
          return (
            <ResultLangAccordion
              key={lang}
              langCode={lang}
              langLabel={`${getLanguageDisplayName(lang)} — text & audio`}
              defaultExpanded={i === 0}
              text={langText}
              editable
              onSave={(val) => setEditedTexts((prev) => ({ ...prev, [lang]: val }))}
              onCopy={() => copyText(langText, notify)}
              shareTitle={`${pageTitle} — ${getLanguageDisplayName(lang)}`}
              shareText={langText}
              onNotify={notify}
            >
            <Box sx={{ mb: 2, '& .rhap_container': { borderRadius: '12px', border: '1px solid rgba(17,17,17,0.06)' } }}>
              <AudioPlayer
                src={data.audio_file_path}
                customVolumeControls={[]}
                customAdditionalControls={[]}
                showJumpControls={false}
              />
            </Box>
            <MediaTrimEditor
              url={data.audio_file_path}
              filename={`${(audioTitle || 'synthesis').replace(/\s+/g, '_')}_${lang}_trim`}
              onNotify={notify}
              ensureExport={ensureCredits}
              height={72}
            />
            <Box sx={{ mt: 2 }}>
              <Tooltip title={!lowCredits ? 'Download audio file' : exportBlockedTitle}>
                <span>
                  <Button
                    startIcon={<CloudDownloadIcon />}
                    onClick={() => downloadUrl(data.audio_file_path, notify)}
                    disabled={lowCredits}
                    sx={rvPrimaryButtonSx}
                  >
                    Download audio
                  </Button>
                </span>
              </Tooltip>
            </Box>
            </ResultLangAccordion>
          );
        })}
      </ResultViewLayout>

      <ResultViewSnackbar {...snackbar} onClose={closeNotify} />
    </>
  );
};

export default ViewttsAudioComponent;
