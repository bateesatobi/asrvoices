import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { VolumeUp } from '@mui/icons-material';
import { StudioJobProgressBar } from './progress';
import { ttsAPI, getFriendlyErrorMessage } from '../services/api';
import { NEURAL_SPEAKERS, NEURAL_LANGUAGES } from '../constants/neural_config';
import useStudioUser from '../hooks/useStudioUser';
import StudioPageShell from './Layout/StudioPageShell';
import StudioHistorySection from './Layout/StudioHistorySection';
import SoundtrackPickerSection, { useSoundtrackPicker } from './Redesigned/SoundtrackPickerSection';
import {
  ElevenLabsButton,
  StudioPlayerBar,
  PropertySection,
  PropertyRow,
  ElevenLabsFileUpload,
  SettingSelect,
  ElevenLabsSettingsPanel,
  SettingSection,
} from './ElevenLabsUI';

const TTS_RATE = 0.001;

export default function SynthesizeComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const { userId, balance, refreshBalance } = useStudioUser();

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
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

  const estimatedCost = text.trim()
    ? Math.max(Math.round(text.length * TTS_RATE * 100) / 100, 0.01)
    : file
      ? Math.max(Math.round((file.size / 3000) * TTS_RATE * 3000 * 100) / 100, 0.01)
      : 0;

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
      if (text.trim()) {
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
      } else if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error('File must be under 10MB');
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
      } else {
        throw new Error('Enter text or upload a document');
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
          disabled={(!text.trim() && !file) || (balance !== null && balance < estimatedCost)}
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
        subtitle="Convert text or documents into natural speech"
        settingsContent={settingsContent}
        showPropertiesPanel={!isMobile}
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
        footer={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: '0.8125rem', color: '#999' }}>Or upload a document</Typography>
            <ElevenLabsFileUpload
              onFileSelect={setFile}
              selectedFile={file}
              onClearFile={() => setFile(null)}
              accept=".pdf,.doc,.docx,.txt"
            />
            {text.length > 0 && (
              <Typography sx={{ fontSize: '0.75rem', color: '#999', ml: 'auto' }}>
                {text.length} characters
              </Typography>
            )}
          </Box>
        }
      >
        <StudioJobProgressBar
          open={loading}
          message="Generating speech…"
          submessage={
            jobProgress > 0
              ? `${Math.round(jobProgress)}% complete`
              : 'Synthesizing audio from your text'
          }
        />
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
