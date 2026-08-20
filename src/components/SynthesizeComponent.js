import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Alert,
  Chip,
  IconButton,
} from '@mui/material';
import {
  VolumeUp,
  CloudUpload,
  TextFields,
  Description,
  Article,
  PictureAsPdf,
  Close,
} from '@mui/icons-material';
import { StudioJobProgressBar } from './progress';
import { ttsAPI, getFriendlyErrorMessage } from '../services/api';
import { NEURAL_SPEAKERS, NEURAL_LANGUAGES } from '../constants/neural_config';
import useStudioUser from '../hooks/useStudioUser';
import StudioPageShell from './Layout/StudioPageShell';
import StudioHistorySection from './Layout/StudioHistorySection';
import { STUDIO_VISUALS } from '../data/studioVisuals';
import SoundtrackPickerSection, { useSoundtrackPicker } from './Redesigned/SoundtrackPickerSection';
import {
  ElevenLabsButton,
  StudioPlayerBar,
  PropertySection,
  PropertyRow,
  SettingSelect,
  ElevenLabsSettingsPanel,
  SettingSection,
  ElevenLabsTabs,
} from './ElevenLabsUI';

const TTS_RATE = 0.001;
const MAX_DOC_MB = 10;

const INPUT_TABS = [
  { label: 'Text to Speech', icon: <TextFields fontSize="small" /> },
  { label: 'Document Upload', icon: <CloudUpload fontSize="small" /> },
];

const DOC_FORMATS = [
  { ext: 'PDF', icon: <PictureAsPdf sx={{ fontSize: 16 }} /> },
  { ext: 'DOCX', icon: <Description sx={{ fontSize: 16 }} /> },
  { ext: 'DOC', icon: <Description sx={{ fontSize: 16 }} /> },
  { ext: 'TXT', icon: <Article sx={{ fontSize: 16 }} /> },
];

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(name = '') {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return PictureAsPdf;
  if (lower.endsWith('.doc') || lower.endsWith('.docx')) return Description;
  return Article;
}

export default function SynthesizeComponent() {
  const location = useLocation();
  const { userId, balance, refreshBalance } = useStudioUser();

  const [activeTab, setActiveTab] = useState(0);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState(NEURAL_SPEAKERS[0]);
  const [outputLang, setOutputLang] = useState(NEURAL_SPEAKERS[0].lang);
  const [textLang, setTextLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [dryAudioUrl, setDryAudioUrl] = useState(null);
  const [resultDocId, setResultDocId] = useState(null);
  const [resultSource, setResultSource] = useState('vocify');
  const [jobProgress, setJobProgress] = useState(0);
  const soundtrack = useSoundtrackPicker();

  useEffect(() => {
    const voiceId = location.state?.voiceId;
    if (!voiceId) return;
    const speaker = NEURAL_SPEAKERS.find((s) => s.id === voiceId);
    if (speaker) setSelectedSpeaker(speaker);
  }, [location.state?.voiceId]);

  const isTextMode = activeTab === 0;
  const canGenerate = isTextMode ? Boolean(text.trim()) : Boolean(file);

  const estimatedCost = isTextMode
    ? text.trim()
      ? Math.max(Math.round(text.length * TTS_RATE * 100) / 100, 0.01)
      : 0
    : file
      ? Math.max(Math.round((file.size / 3000) * TTS_RATE * 3000 * 100) / 100, 0.01)
      : 0;

  const handleTabChange = (_, v) => {
    setActiveTab(v);
    setError(null);
    if (v === 0) setFile(null);
    else setText('');
  };

  const handleFileSelect = (selected) => {
    if (!selected) return;
    if (selected.size > MAX_DOC_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_DOC_MB}MB`);
      return;
    }
    setFile(selected);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const resolveAudioUrl = async (docId, lang, collection = 'vocify') => {
    const voiceData =
      collection === 'document'
        ? await ttsAPI.getDocumentVoice(docId)
        : await ttsAPI.getVocifyVoice(docId);
    const path =
      voiceData.entries?.[0]?.translations_with_tts?.[lang]?.audio_file_path ||
      voiceData.entries?.[0]?.audio_file_path ||
      voiceData.audio_url;
    if (path) setAudioUrl(path);
  };

  const handleGenerate = async () => {
    if (!userId) {
      setError('Please log in to use text-to-speech');
      return;
    }
    setError(null);
    setLoading(true);
    setAudioUrl(null);
    setDryAudioUrl(null);
    setResultDocId(null);
    setJobProgress(0);
    const pollOptions = { onProgress: (job) => setJobProgress(Number.isFinite(job.progress) ? job.progress : 0) };
    try {
      if (isTextMode) {
        if (!text.trim()) throw new Error('Enter text to synthesize');
        if (text.length > 5000) throw new Error('Text exceeds 5000 character limit');
        const res = await ttsAPI.synthesizeText(
          text,
          selectedSpeaker.id,
          outputLang,
          userId,
          null,
          { ...pollOptions, textLang }
        );
        const dry = res.dry_audio_url || res.audio_file_url;
        if (dry) {
          setDryAudioUrl(dry);
          setAudioUrl(dry);
        }
        if (res.doc_id) {
          setResultDocId(res.doc_id);
          setResultSource('vocify');
        }
        if (!dry && res.doc_id) await resolveAudioUrl(res.doc_id, outputLang);
        else if (!dry) throw new Error('No audio received');
      } else {
        if (!file) throw new Error('Upload a document to synthesize');
        if (file.size > MAX_DOC_MB * 1024 * 1024) throw new Error(`File must be under ${MAX_DOC_MB}MB`);
        const res = await ttsAPI.translateDocumentWithTTS(
          file,
          outputLang,
          [outputLang],
          selectedSpeaker.id,
          userId,
          null,
          pollOptions
        );
        const directUrl = res.translations?.[outputLang]?.dry_audio_path
          || res.translations?.[outputLang]?.audio_file_path;
        if (directUrl) {
          setDryAudioUrl(directUrl);
          setAudioUrl(directUrl);
        }
        if (res.doc_id) {
          setResultDocId(res.doc_id);
          setResultSource('document_tts');
          if (!directUrl) await resolveAudioUrl(res.doc_id, outputLang, 'document');
        } else throw new Error('No document ID received');
      }
      refreshBalance();
      window.dispatchEvent(new CustomEvent('refresh-balance'));
      window.dispatchEvent(new CustomEvent('library-updated'));
    } catch (e) {
      if (e.response?.status === 402) {
        window.dispatchEvent(
          new CustomEvent('subscription-limit-exceeded', {
            detail: { message: e.response?.data?.detail || 'Insufficient credits.', status: 402 },
          })
        );
        setError(e.response?.data?.detail || 'Insufficient credits.');
      } else {
        setError(getFriendlyErrorMessage(e, 'Generation failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const settingsContent = (
    <ElevenLabsSettingsPanel sx={{ border: 'none', boxShadow: 'none', borderRadius: 0 }}>
      <SettingSection title="Voice">
        <SettingSelect
          label="Speaker"
          value={selectedSpeaker.id}
          onChange={(e) => {
            const speaker = NEURAL_SPEAKERS.find((s) => s.id === e.target.value);
            if (speaker) setSelectedSpeaker(speaker);
          }}
          options={NEURAL_SPEAKERS.map((v) => ({
            value: v.id,
            label: `${v.name} · native ${v.lang.toUpperCase()}`,
          }))}
        />
        {isTextMode && (
          <>
            <SettingSelect
              label="Text language"
              value={textLang}
              onChange={(e) => setTextLang(e.target.value)}
              options={NEURAL_LANGUAGES.filter((l) => l.code !== 'all').map((l) => ({
                value: l.code,
                label: l.name,
              }))}
            />
            <Typography sx={{ fontSize: '0.75rem', color: '#888', px: 0.5, mt: -0.5 }}>
              Language of the text you typed. The voice is chosen by the speaker above — Spark handles pronunciation.
            </Typography>
          </>
        )}
        <SettingSelect
          label="Output language"
          value={outputLang}
          onChange={(e) => setOutputLang(e.target.value)}
          options={NEURAL_LANGUAGES.filter((l) => l.code !== 'all').map((l) => ({
            value: l.code,
            label: l.name,
          }))}
        />
        <Typography sx={{ fontSize: '0.75rem', color: '#888', px: 0.5, mt: -0.5 }}>
          Pick any speaker and choose which language they speak — they don&apos;t have to match.
        </Typography>
      </SettingSection>
      <SoundtrackPickerSection
        {...soundtrack}
        dryAudioUrl={dryAudioUrl}
        docId={resultDocId}
        source={resultSource}
        lang={outputLang}
        userId={userId}
        onApplied={(url) => setAudioUrl(url)}
      />
      <PropertySection title="Credits" defaultOpen={false}>
        <PropertyRow label="Balance" value={balance !== null ? balance.toFixed(2) : '…'} />
        <PropertyRow label="Estimated" value={`${estimatedCost.toFixed(2)} credits`} />
      </PropertySection>
      <Box sx={{ px: 3, pb: 3 }}>
        <ElevenLabsButton
          variant="contained"
          fullWidth
          size="large"
          loading={loading}
          disabled={!canGenerate || (balance !== null && balance < estimatedCost)}
          onClick={handleGenerate}
        >
          Generate speech
        </ElevenLabsButton>
      </Box>
    </ElevenLabsSettingsPanel>
  );

  return (
    <>
      <StudioPageShell
        data-tour="tts-editor"
        icon={<VolumeUp sx={{ fontSize: 22 }} />}
        title="Text to Speech"
        subtitle={
          isTextMode
            ? 'Type or paste text and generate lifelike speech'
            : 'Upload a document and convert it to natural speech'
        }
        settingsContent={settingsContent}
        hero={{
          image: STUDIO_VISUALS.tts.image,
          title: 'Text to Speech',
          subtitle: isTextMode
            ? 'Type or paste text and generate lifelike speech'
            : 'Upload a document and convert it to natural speech',
        }}
        bottomBar={
          <StudioPlayerBar
            voiceName={selectedSpeaker.name}
            voiceLang={outputLang}
            audioUrl={audioUrl}
            disabled={!audioUrl}
            onDownload={() => {
              if (!audioUrl) return;
              const link = document.createElement('a');
              link.href = audioUrl;
              link.download = 'synthesis.mp3';
              link.target = '_blank';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          />
        }
      >
        <StudioJobProgressBar
          open={loading}
          message={isTextMode ? 'Generating speech…' : 'Processing document…'}
          submessage={
            jobProgress > 0
              ? `${Math.round(jobProgress)}% complete`
              : isTextMode
                ? 'Synthesizing audio from your text'
                : 'Extracting text and generating speech'
          }
        />

        <Box sx={{ mb: 3 }}>
          <ElevenLabsTabs value={activeTab} onChange={handleTabChange} tabs={INPUT_TABS} />
        </Box>

        {isTextMode ? (
          <>
            <TextField
              multiline
              minRows={12}
              placeholder="Start typing here or paste any text you want to turn into lifelike speech..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              fullWidth
              variant="standard"
              InputProps={{ disableUnderline: true }}
              sx={{
                '& .MuiInputBase-root': { fontSize: '1rem', lineHeight: 1.7, color: '#1a1a1a' },
                '& .MuiInputBase-input::placeholder': { color: '#bbb', opacity: 1 },
              }}
            />
            {text.length > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 1.5, textAlign: 'right' }}>
                {text.length} / 5000 characters
              </Typography>
            )}
          </>
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
            {!file ? (
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
                        '& .MuiChip-icon': { color: '#666' },
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    bgcolor: 'rgba(232,160,32,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {React.createElement(fileIcon(file.name), { sx: { fontSize: 24, color: '#E8A020' } })}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: '0.9375rem',
                      fontWeight: 600,
                      color: '#1a1a1a',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8125rem', color: '#666', mt: 0.25 }}>
                    {formatFileSize(file.size)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setFile(null)}
                  sx={{ color: '#666', '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        )}
        <StudioHistorySection sourceId="tts" />
      </StudioPageShell>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'fixed', bottom: 88, right: 24, zIndex: 9999, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}
    </>
  );
}
