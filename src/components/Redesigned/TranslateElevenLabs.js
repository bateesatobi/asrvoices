import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Translate as TranslateIcon,
  SwapHoriz as SwapIcon,
  Article as ArticleIcon,
  Description as DocIcon,
  PictureAsPdf as PdfIcon,
  CloudUpload,
  Close,
  TextFields,
} from '@mui/icons-material';
import {
  ElevenLabsButton,
  ElevenLabsTabs,
  SettingSelect,
  ElevenLabsSettingsPanel,
  SettingSection,
  PropertySection,
  PropertyRow,
} from '../ElevenLabsUI';
import StudioPageShell from '../Layout/StudioPageShell';
import StudioHistorySection from '../Layout/StudioHistorySection';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  setSourceLanguage,
  setTargetLanguage,
  setInputText,
  setTranslatedText,
  appendTranslatedChunk,
  setSelectedFile,
  translateText,
  translateDocument,
  clearTranslation,
} from '../../store/slices/translationSlice';
import { translationAPI, subscriptionAPI, BASE_URL } from '../../services/api';
import {
  TRANSLATE_LANGUAGES,
  getTranslateLanguageLabel,
  toIso6393,
} from '../../constants/translateLanguages';
import useStudioUser from '../../hooks/useStudioUser';
import { StudioJobProgressBar } from '../progress';
import { STUDIO_VISUALS } from '../../data/studioVisuals';

const INPUT_TABS = [
  { label: 'Text', icon: <TextFields fontSize="small" /> },
  { label: 'Document', icon: <CloudUpload fontSize="small" /> },
];

const DOC_FORMATS = [
  { ext: 'PDF', icon: <PdfIcon sx={{ fontSize: 16 }} /> },
  { ext: 'DOCX', icon: <DocIcon sx={{ fontSize: 16 }} /> },
  { ext: 'DOC', icon: <DocIcon sx={{ fontSize: 16 }} /> },
  { ext: 'TXT', icon: <ArticleIcon sx={{ fontSize: 16 }} /> },
];

const MAX_DOC_MB = 10;

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return PdfIcon;
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return DocIcon;
  return ArticleIcon;
}

export default function TranslateElevenLabs() {
  const dispatch = useAppDispatch();
  const { userId, balance, refreshBalance } = useStudioUser();
  const {
    sourceLanguage,
    targetLanguage,
    inputText,
    translatedText,
    selectedFile,
    isLoading,
    error: sliceError,
  } = useAppSelector((state) => state.translation);

  const [inputTab, setInputTab] = useState(0);
  const [toast, setToast] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [streamInfo, setStreamInfo] = useState('');
  const [jobProgress, setJobProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const isTextMode = inputTab === 0;
  const canTranslate = isTextMode ? inputText.trim().length > 0 : Boolean(selectedFile);
  const busy = isLoading || streaming;
  const sourceIso = toIso6393(sourceLanguage) || sourceLanguage;
  const targetIso = toIso6393(targetLanguage) || targetLanguage;

  useEffect(() => {
    if (sliceError) setToast({ sev: 'error', msg: sliceError });
  }, [sliceError]);

  // SSE stream for async text/document jobs
  useEffect(() => {
    if (!streaming || !userId) return undefined;
    dispatch(setTranslatedText(''));
    setStreamInfo('Connecting…');
    const streamUrl = `${BASE_URL}/translate/stream/${userId}`;
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => setStreamInfo('Translating…');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.chunk) {
          dispatch(appendTranslatedChunk(data.chunk));
        }
        if (data.error) {
          setStreamInfo('');
          setStreaming(false);
          setToast({ sev: 'error', msg: data.error });
        }
      } catch {
        /* ignore */
      }
    };
    eventSource.onerror = () => {
      setStreamInfo('');
      setStreaming(false);
      eventSource.close();
      refreshBalance();
      window.dispatchEvent(new CustomEvent('library-updated'));
    };

    return () => eventSource.close();
  }, [streaming, userId, dispatch, refreshBalance]);

  // Poll job progress for document uploads
  useEffect(() => {
    if (!isLoading || !userId || isTextMode) return undefined;
    const interval = setInterval(async () => {
      try {
        const status = await translationAPI.getTranslationStatus(userId);
        setJobProgress(status.percentage || 0);
        if (status.status === 'completed') {
          setStreaming(false);
          setJobProgress(100);
          window.dispatchEvent(new CustomEvent('library-updated'));
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isLoading, userId, isTextMode]);

  const handleInputTabChange = (_, v) => {
    setInputTab(v);
    setToast(null);
    if (v === 0) dispatch(setSelectedFile(null));
    else dispatch(setInputText(''));
  };

  const handleSwapLanguages = () => {
    dispatch(setSourceLanguage(targetLanguage));
    dispatch(setTargetLanguage(sourceLanguage));
    if (translatedText && inputText) {
      dispatch(setInputText(translatedText));
      dispatch(setTranslatedText(inputText));
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = /\.(pdf|doc|docx|txt)$/i.test(file.name);
    if (!allowed) {
      setToast({ sev: 'error', msg: 'Use PDF, DOC, DOCX, or TXT files only' });
      return;
    }
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setToast({ sev: 'error', msg: `File must be under ${MAX_DOC_MB}MB` });
      return;
    }
    dispatch(setSelectedFile(file));
    dispatch(setInputText(''));
    dispatch(setTranslatedText(''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleTranslate = async () => {
    if (!userId) {
      setToast({ sev: 'error', msg: 'Please log in to translate' });
      return;
    }
    setToast(null);
    setJobProgress(0);

    try {
      if (isTextMode && inputText.trim()) {
        const result = await dispatch(
          translateText({
            text: inputText,
            sourceLang: sourceIso,
            targetLang: targetIso,
            userId,
          })
        ).unwrap();
        if (result.status === 'started') setStreaming(true);
        else if (result.translatedText) {
          setToast({ sev: 'success', msg: 'Translation complete' });
          window.dispatchEvent(new CustomEvent('library-updated'));
        }
      } else if (!isTextMode && selectedFile) {
        const result = await dispatch(
          translateDocument({
            file: selectedFile,
            sourceLang: sourceIso,
            targetLang: targetIso,
            userId,
          })
        ).unwrap();
        if (result.status === 'started') setStreaming(true);
      }
      subscriptionAPI.getBalance(userId).then(() => {
        refreshBalance();
        window.dispatchEvent(new CustomEvent('refresh-balance'));
      }).catch(() => {});
    } catch (e) {
      setToast({ sev: 'error', msg: typeof e === 'string' ? e : 'Translation failed' });
    }
  };

  const handleClear = () => {
    dispatch(clearTranslation());
    setStreaming(false);
    setJobProgress(0);
    setStreamInfo('');
  };

  useEffect(() => {
    if (sourceIso && sourceIso !== sourceLanguage) dispatch(setSourceLanguage(sourceIso));
    if (targetIso && targetIso !== targetLanguage) dispatch(setTargetLanguage(targetIso));
  }, [dispatch, sourceIso, sourceLanguage, targetIso, targetLanguage]);

  const sourceLabel = getTranslateLanguageLabel(sourceIso);
  const targetLabel = getTranslateLanguageLabel(targetIso);

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Languages">
        <SettingSelect
          label="Source"
          value={sourceIso}
          onChange={(e) => dispatch(setSourceLanguage(e.target.value))}
          options={TRANSLATE_LANGUAGES}
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
          <IconButton
            size="small"
            onClick={handleSwapLanguages}
            sx={{
              border: '1px solid #e8e8e8',
              bgcolor: '#fafafa',
              '&:hover': { bgcolor: 'rgba(232,160,32,0.08)', borderColor: '#E8A020' },
            }}
            aria-label="Swap languages"
          >
            <SwapIcon fontSize="small" />
          </IconButton>
        </Box>
        <SettingSelect
          label="Target"
          value={targetIso}
          onChange={(e) => dispatch(setTargetLanguage(e.target.value))}
          options={TRANSLATE_LANGUAGES}
        />
      </SettingSection>
      <PropertySection title="Account" defaultOpen={false}>
        <PropertyRow label="Credits" value={balance !== null ? balance.toFixed(2) : '…'} />
        <PropertyRow label="Mode" value={isTextMode ? 'Text' : 'Document'} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          size="large"
          loading={busy}
          disabled={busy || !canTranslate}
          onClick={handleTranslate}
        >
          Translate
        </ElevenLabsButton>
        {(inputText || selectedFile || translatedText) && (
          <ElevenLabsButton variant="outlined" fullWidth size="small" onClick={handleClear}>
            Clear
          </ElevenLabsButton>
        )}
      </Box>
    </ElevenLabsSettingsPanel>
  );

  const FileIcon = selectedFile ? fileIcon(selectedFile.name) : CloudUpload;

  return (
    <>
      <StudioPageShell
        icon={<TranslateIcon sx={{ fontSize: 22 }} />}
        title="Translate"
        subtitle={`Convert content from ${sourceLabel} to ${targetLabel}`}
        settingsContent={settingsContent}
        hero={{
          image: STUDIO_VISUALS.translate.image,
          title: 'Translate',
          subtitle: `Convert content from ${sourceLabel} to ${targetLabel}`,
        }}
      >
        <StudioJobProgressBar
          open={busy}
          message={
            streaming
              ? streamInfo || 'Translating…'
              : isTextMode
                ? 'Translating text…'
                : 'Processing document…'
          }
          submessage={
            streaming
              ? 'Translation will appear in your history when complete'
              : !isTextMode
                ? 'Extracting and translating your document'
                : 'Sending text to the translation service'
          }
          progress={!isTextMode && jobProgress > 0 ? jobProgress : undefined}
        />
        <Box sx={{ mb: 3 }}>
          <ElevenLabsTabs value={inputTab} onChange={handleInputTabChange} tabs={INPUT_TABS} />
        </Box>

        {isTextMode ? (
          <TextField
            multiline
            minRows={10}
            placeholder="Enter or paste text to translate…"
            value={inputText}
            onChange={(e) => dispatch(setInputText(e.target.value))}
            fullWidth
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInputBase-root': { fontSize: '1rem', lineHeight: 1.7, color: '#1a1a1a' },
              '& .MuiInputBase-input::placeholder': { color: '#bbb', opacity: 1 },
            }}
          />
        ) : (
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => {
                handleFileSelect(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
            {!selectedFile ? (
              <Box
                onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  border: isDragging ? '2px dashed #E8A020' : '2px dashed #e8e8e8',
                  borderRadius: '16px',
                  bgcolor: isDragging ? 'rgba(232,160,32,0.06)' : '#fafafa',
                  p: { xs: 4, md: 6 },
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#E8A020',
                    bgcolor: 'rgba(232,160,32,0.04)',
                  },
                }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '14px',
                    bgcolor: 'rgba(232,160,32,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CloudUpload sx={{ fontSize: 28, color: '#E8A020' }} />
                </Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: '#1a1a1a', mb: 0.75 }}>
                  Drop your document here
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: '#666', mb: 2 }}>
                  or click to browse · max {MAX_DOC_MB}MB
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                  {DOC_FORMATS.map((f) => (
                    <Chip
                      key={f.ext}
                      icon={f.icon}
                      label={f.ext}
                      size="small"
                      sx={{
                        bgcolor: '#fff',
                        border: '1px solid #e8e8e8',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box
                sx={{
                  border: '2px solid #E8A020',
                  borderRadius: '16px',
                  bgcolor: 'rgba(232,160,32,0.04)',
                  p: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: '#fff',
                      border: '1px solid rgba(232,160,32,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileIcon sx={{ fontSize: 26, color: '#E8A020' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.9375rem', fontWeight: 600, color: '#1a1a1a' }} noWrap>
                      {selectedFile.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8125rem', color: '#666', mt: 0.25 }}>
                      {formatFileSize(selectedFile.size)} · {sourceLabel} → {targetLabel}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(setSelectedFile(null))}
                    sx={{ color: '#999', '&:hover': { color: '#1a1a1a' } }}
                    aria-label="Remove file"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <ElevenLabsButton
                    variant="outlined"
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Replace file
                  </ElevenLabsButton>
                </Box>
              </Box>
            )}

          </Box>
        )}

        {isTextMode && inputText.length > 0 && (
          <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 2 }}>
            {inputText.length} characters
          </Typography>
        )}

        <StudioHistorySection sourceId="translation" />
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
