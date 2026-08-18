import React, { useState } from 'react';
import {
  Typography,
  TextField,
  Alert,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import {
  Summarize as SummarizeIcon,
} from '@mui/icons-material';
import {
  ElevenLabsButton,
  ElevenLabsFileUpload,
  ElevenLabsTabs,
  SettingSelect,
  ElevenLabsSettingsPanel,
  SettingSection,
  PropertySection,
  PropertyRow,
} from '../ElevenLabsUI';
import StudioPageShell from '../Layout/StudioPageShell';
import StudioHistorySection from '../Layout/StudioHistorySection';
import { summarizationAPI, getFriendlyErrorMessage } from '../../services/api';
import { LANGUAGES } from '../../constants/languages';
import useStudioUser from '../../hooks/useStudioUser';
import { StudioJobProgressBar } from '../progress';

const INPUT_MODES = [
  { label: 'Text', accept: '' },
  { label: 'Document', accept: '.pdf,.doc,.docx,.txt' },
  { label: 'Audio', accept: '.wav,.mp3,.m4a,.flac' },
  { label: 'Video', accept: '.mp4,.avi,.mov,.webm' },
];

const SUMMARY_LENGTHS = [
  { value: '100', label: 'Short (~100 words)' },
  { value: '250', label: 'Medium (~250 words)' },
  { value: '500', label: 'Long (~500 words)' },
  { value: '1000', label: 'Detailed (~1000 words)' },
];

function detectInputMode(file) {
  if (!file) return 0;
  const name = file.name.toLowerCase();
  if (/\.(pdf|doc|docx|txt)$/.test(name)) return 1;
  if (/\.(wav|mp3|m4a|flac|ogg)$/.test(name)) return 2;
  if (/\.(mp4|avi|mov|webm|mkv)$/.test(name) || file.type?.startsWith('video/')) return 3;
  return 1;
}

function extractSummaryText(result) {
  if (!result) return '';
  if (typeof result === 'string') return result;
  return (
    result.summary ||
    result.text ||
    result.summary_text ||
    result.entries?.[0]?.summary ||
    ''
  );
}

export default function SummarizeElevenLabs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { userId, balance, refreshBalance } = useStudioUser();

  const [inputMode, setInputMode] = useState(0);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [textContent, setTextContent] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [summaryLength, setSummaryLength] = useState('250');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSummarize = async () => {
    if (!userId) {
      setToast({ sev: 'error', msg: 'Please log in to continue' });
      return;
    }
    if (!textContent.trim() && !uploadedFile) {
      setToast({ sev: 'error', msg: 'Enter text or upload a file' });
      return;
    }

    setIsProcessing(true);
    setToast(null);
    try {
      let result;
      const wordCount = summaryLength;

      if (textContent.trim()) {
        result = await summarizationAPI.summarizeText(
          textContent,
          sourceLanguage,
          userId,
          wordCount
        );
      } else {
        const mode = detectInputMode(uploadedFile);
        if (mode === 1) {
          result = await summarizationAPI.summarizeDocument(
            uploadedFile,
            sourceLanguage,
            userId,
            wordCount
          );
        } else if (mode === 2) {
          result = await summarizationAPI.summarizeUpload(
            uploadedFile,
            sourceLanguage,
            userId,
            wordCount
          );
        } else {
          result = await summarizationAPI.summarizeAudioFromVideo(
            uploadedFile,
            sourceLanguage,
            userId,
            wordCount
          );
        }
      }

      extractSummaryText(result);
      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
      setToast({ sev: 'success', msg: 'Summary ready' });
    } catch (error) {
      setToast({ sev: 'error', msg: getFriendlyErrorMessage(error, 'Summarization failed.') });
    } finally {
      setIsProcessing(false);
    }
  };

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Summary">
        <SettingSelect
          label="Source language"
          value={sourceLanguage}
          onChange={(e) => setSourceLanguage(e.target.value)}
          options={LANGUAGES.map((l) => ({ value: l.value, label: l.label }))}
        />
        <SettingSelect
          label="Length (word_count)"
          value={summaryLength}
          onChange={(e) => setSummaryLength(e.target.value)}
          options={SUMMARY_LENGTHS}
        />
      </SettingSection>
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credits" value={balance !== null ? balance.toFixed(2) : '…'} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3 }}>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          size="large"
          loading={isProcessing}
          disabled={isProcessing || (!textContent.trim() && !uploadedFile)}
          onClick={handleSummarize}
        >
          Summarize
        </ElevenLabsButton>
      </Box>
    </ElevenLabsSettingsPanel>
  );

  return (
    <>
      <StudioPageShell
        icon={<SummarizeIcon sx={{ fontSize: 22 }} />}
        title="Summarize"
        subtitle="Condense text, documents, audio, or video into a clear summary"
        settingsContent={settingsContent}
        showPropertiesPanel={!isMobile}
      >
        <StudioJobProgressBar open={isProcessing} message="Summarizing…" submessage="Analyzing your content" />
        <Box sx={{ mb: 2 }}>
          <ElevenLabsTabs
            value={inputMode}
            onChange={(_, v) => {
              setInputMode(v);
              if (v > 0) setTextContent('');
              else setUploadedFile(null);
            }}
            tabs={INPUT_MODES.map((m) => ({ label: m.label }))}
          />
        </Box>

        {inputMode === 0 ? (
          <TextField
            multiline
            minRows={8}
            placeholder="Paste the text you want summarized…"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInputBase-root': { fontSize: '1rem', lineHeight: 1.7, color: '#1a1a1a' },
              '& .MuiInputBase-input::placeholder': { color: '#bbb', opacity: 1 },
            }}
          />
        ) : (
          <Box
            sx={{
              border: uploadedFile ? '2px solid #E8A020' : '2px dashed #e8e8e8',
              borderRadius: '16px',
              bgcolor: uploadedFile ? 'rgba(232,160,32,0.04)' : '#fafafa',
              p: 4,
              textAlign: 'center',
            }}
          >
            <ElevenLabsFileUpload
              onFileSelect={(f) => {
                setUploadedFile(f);
                setTextContent('');
              }}
              selectedFile={uploadedFile}
              onClearFile={() => setUploadedFile(null)}
              accept={INPUT_MODES[inputMode].accept}
            />
          </Box>
        )}

        <StudioHistorySection sourceId="summary" />
      </StudioPageShell>

      {toast && (
        <Alert
          severity={toast.sev}
          onClose={() => setToast(null)}
          sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, borderRadius: '8px' }}
        >
          {toast.msg}
        </Alert>
      )}
    </>
  );
}
